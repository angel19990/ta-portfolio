-- =============================================================
-- 0010 — atomic record_payment RPC
-- =============================================================
--
-- The original recordPayment action did read-modify-write in two round trips:
--   SELECT amount_paid_cents, outstanding_cents
--   compute new values
--   UPDATE ...
-- Two concurrent payments race: both read the same row, both compute the
-- same new totals, the second write loses one payment. Move the math into
-- a single atomic UPDATE inside a SECURITY DEFINER function so the read +
-- write happen as one statement under row-level locks.

create or replace function public.record_payment(
  p_enrollment_id uuid,
  p_amount_cents int
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() <> 'admin' then
    raise exception 'admins only';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'amount must be a positive whole number of cents';
  end if;
  -- Sanity cap: $100k. Catches typos like extra zeros.
  if p_amount_cents > 10000000 then
    raise exception 'amount looks too large';
  end if;

  update public.student_classes sc
  set
    amount_paid_cents = sc.amount_paid_cents + p_amount_cents,
    outstanding_cents = greatest(0, sc.outstanding_cents - p_amount_cents),
    payment_status = case
      when greatest(0, sc.outstanding_cents - p_amount_cents) = 0 then 'paid'
      when sc.amount_paid_cents + p_amount_cents > 0 then 'partial'
      else 'unpaid'
    end
  where sc.id = p_enrollment_id;

  if not found then
    raise exception 'enrollment not found';
  end if;
end;
$$;

revoke all on function public.record_payment(uuid, int) from public;
grant execute on function public.record_payment(uuid, int) to authenticated;
