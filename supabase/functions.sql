-- Run these SQL functions in your Supabase SQL editor

-- 1. Dashboard metrics RPC
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_spares INTEGER;
  v_abb_count INTEGER;
  v_takraf_count INTEGER;
  v_total_stock_value NUMERIC;
  v_zero_stock_count INTEGER;
  v_low_stock_count INTEGER;
  v_preservation_due_7_days INTEGER;
  v_transactions_today INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_spares FROM spares;
  SELECT COUNT(*) INTO v_abb_count FROM spares WHERE oem = 'ABB';
  SELECT COUNT(*) INTO v_takraf_count FROM spares WHERE oem = 'TAKRAF';
  SELECT COALESCE(SUM(qty_stock * unit_cost), 0) INTO v_total_stock_value FROM spares WHERE unit_cost IS NOT NULL;
  SELECT COUNT(*) INTO v_zero_stock_count FROM spares WHERE qty_stock = 0;
  SELECT COUNT(*) INTO v_low_stock_count FROM spares WHERE qty_stock > 0 AND qty_stock <= qty_min;
  SELECT COUNT(*) INTO v_preservation_due_7_days FROM spares
    WHERE requires_preservation = true
      AND next_preservation_date IS NOT NULL
      AND next_preservation_date <= (CURRENT_DATE + INTERVAL '7 days');
  SELECT COUNT(*) INTO v_transactions_today FROM stock_transactions
    WHERE transaction_date = CURRENT_DATE;

  RETURN json_build_object(
    'total_spares', v_total_spares,
    'abb_count', v_abb_count,
    'takraf_count', v_takraf_count,
    'total_stock_value', v_total_stock_value,
    'zero_stock_count', v_zero_stock_count,
    'low_stock_count', v_low_stock_count,
    'preservation_due_7_days', v_preservation_due_7_days,
    'transactions_today', v_transactions_today
  );
END;
$$;

-- 2. Issue stock RPC (atomic stock deduction + transaction record)
CREATE OR REPLACE FUNCTION issue_stock(
  p_spare_id UUID,
  p_quantity INTEGER,
  p_issued_to TEXT,
  p_work_order TEXT DEFAULT NULL,
  p_cost_code TEXT DEFAULT NULL,
  p_remarks TEXT DEFAULT NULL,
  p_transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS stock_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_spare spares%ROWTYPE;
  v_tx stock_transactions%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT * INTO v_spare FROM spares WHERE id = p_spare_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Spare not found';
  END IF;

  IF v_spare.qty_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: have %, requested %', v_spare.qty_stock, p_quantity;
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  UPDATE spares SET qty_stock = qty_stock - p_quantity WHERE id = p_spare_id;

  INSERT INTO stock_transactions (
    spare_id, movement_type, quantity, qty_before, qty_after,
    issued_to, work_order, cost_code, remarks, transaction_date,
    created_by, spare_tag, spare_description, spare_part_number, spare_oem, spare_bin
  ) VALUES (
    p_spare_id, 'issue', p_quantity, v_spare.qty_stock, v_spare.qty_stock - p_quantity,
    p_issued_to, p_work_order, p_cost_code, p_remarks, p_transaction_date,
    v_user_id, v_spare.tag, v_spare.description, v_spare.part_number, v_spare.oem, v_spare.bin_location
  )
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$;

-- 3. Optional: Audit log trigger (if not already set up)
-- CREATE OR REPLACE FUNCTION log_audit_event()
-- RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
--   VALUES (
--     TG_TABLE_NAME,
--     COALESCE(NEW.id::text, OLD.id::text),
--     TG_OP,
--     CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
--     CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
--     auth.uid()
--   );
--   RETURN COALESCE(NEW, OLD);
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
