import { supabase } from '@/lib/supabase';

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referrer_name?: string;
  referrer_phone?: string;
  referral_code: string;
  friend_name: string;
  friend_phone?: string;
  order_id?: string;
  order_number?: string;
  order_total: number;
  reward_amount: number;
  discount_amount?: number;
  status: 'pending' | 'completed' | 'paid' | 'cancelled';
  paid_at?: string;
  notes?: string;
  created_at: string;
  payment_method?: 'money' | 'pix' | 'carne' | 'credit_card' | 'debit_card' | string;
  installments_total?: number;
  installments_paid?: number;
  reward_released?: number; // Valor de cashback proporcionalmente liberado para o indicador
}

export const getStoredLocalReferrals = (_userId?: string): ReferralRecord[] => {
  return [];
};

export const saveStoredLocalReferrals = (_referrals: ReferralRecord[]) => {
  // No-op
};

/**
 * Resolves the referrer (owner of the code) by matching the referral code with user records.
 * Codes are formatted like CESTA-XXXX, where XXXX is the last 4 digits of the referrer's phone or ID.
 */
export const resolveReferrerByCode = async (
  code: string
): Promise<{ id: string; name: string; phone: string } | null> => {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  const suffix = cleanCode.replace(/^CESTA-/, '');

  try {
    if (suffix && suffix.length >= 4) {
      // 1. Try to find user by phone ending with suffix
      const { data: usersByPhone } = await supabase
        .from('users')
        .select('id, name, phone')
        .ilike('phone', `%${suffix}`)
        .limit(1);

      if (usersByPhone && usersByPhone.length > 0) {
        return {
          id: String(usersByPhone[0].id),
          name: usersByPhone[0].name ? String(usersByPhone[0].name) : 'Cliente Cesta Fácil',
          phone: String(usersByPhone[0].phone || '')
        };
      }

      // 2. Try to find user by ID prefix or suffix
      const { data: usersById } = await supabase
        .from('users')
        .select('id, name, phone')
        .ilike('id', `${suffix}%`)
        .limit(1);

      if (usersById && usersById.length > 0) {
        return {
          id: String(usersById[0].id),
          name: usersById[0].name ? String(usersById[0].name) : 'Cliente Cesta Fácil',
          phone: String(usersById[0].phone || '')
        };
      }
    }
  } catch (err) {
    console.warn('Could not resolve referrer by code:', err);
  }

  return null;
};

/**
 * Fetches all referrals for a given user, searching by their userId, phone, or referral code.
 */
export const fetchReferralsFromSupabase = async (
  userId?: string,
  userPhone?: string,
  referralCode?: string
): Promise<ReferralRecord[]> => {
  const cleanPhone = userPhone ? userPhone.replace(/\D/g, '') : '';
  const cleanCode = referralCode ? referralCode.trim().toUpperCase() : '';

  try {
    let query = supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter on the server so a customer only downloads their own referrals
    // (the admin screen intentionally passes no filters and gets everything).
    if (userId || cleanPhone || cleanCode) {
      const filters: string[] = [];
      if (userId) filters.push(`referrer_id.eq.${userId}`);
      if (cleanPhone) filters.push(`referrer_phone.eq.${cleanPhone}`);
      if (cleanCode) filters.push(`referral_code.eq.${cleanCode}`);
      query = query.or(filters.join(','));
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((d: Record<string, unknown>) => {
        const total = Number(d.order_total || 0);
        const rewardTotal = Number(d.reward_amount || 0);
        const status = (d.status as ReferralRecord['status']) || 'pending';
        const method = d.payment_method ? String(d.payment_method) : undefined;
        const instTotal = d.installments_total ? Number(d.installments_total) : 1;
        const instPaid = d.installments_paid ? Number(d.installments_paid) : 0;
        
        // Compute reward_released default if not set
        let released = d.reward_released !== undefined && d.reward_released !== null ? Number(d.reward_released) : 0;
        if (status === 'completed' || status === 'paid') {
          if (released === 0 && rewardTotal > 0 && (!method || method === 'money' || method === 'pix')) {
            released = rewardTotal;
          }
        }

        return {
          id: String(d.id),
          referrer_id: String(d.referrer_id || ''),
          referrer_name: d.referrer_name ? String(d.referrer_name) : '',
          referrer_phone: d.referrer_phone ? String(d.referrer_phone) : '',
          referral_code: String(d.referral_code || ''),
          friend_name: d.friend_name ? String(d.friend_name) : 'Amigo Indicado',
          friend_phone: d.friend_phone ? String(d.friend_phone) : '',
          order_id: d.order_id ? String(d.order_id) : '',
          order_number: d.order_number ? String(d.order_number) : '',
          order_total: total,
          reward_amount: rewardTotal,
          discount_amount: Number(d.discount_amount || 0),
          status,
          paid_at: d.paid_at ? String(d.paid_at) : undefined,
          notes: d.notes ? String(d.notes) : undefined,
          created_at: d.created_at ? String(d.created_at) : new Date().toISOString(),
          payment_method: method,
          installments_total: instTotal,
          installments_paid: instPaid,
          reward_released: released
        };
      });
    }
    return [];
  } catch (err) {
    console.warn('Supabase referrals query failed or table not found:', err);
    return [];
  }
};

export const fetchReferralsForCustomer = async (userId: string, phone?: string): Promise<ReferralRecord[]> => {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const code = cleanPhone.length >= 4 ? `CESTA-${cleanPhone.slice(-4).toUpperCase()}` : undefined;
  return fetchReferralsFromSupabase(userId, phone, code);
};

/**
 * Creates a new referral record in Supabase, auto-resolving the referrer if missing.
 */
export const createReferralInSupabase = async (
  record: Omit<ReferralRecord, 'id' | 'created_at'>
): Promise<ReferralRecord> => {
  let referrerId = record.referrer_id;
  let referrerName = record.referrer_name;
  let referrerPhone = record.referrer_phone;

  // Auto-resolve referrer if not provided
  if (!referrerId && record.referral_code) {
    const resolved = await resolveReferrerByCode(record.referral_code);
    if (resolved) {
      referrerId = resolved.id;
      referrerName = referrerName || resolved.name;
      referrerPhone = referrerPhone || resolved.phone;
    }
  }

  // Prevent self-referral
  if (record.friend_phone && referrerPhone) {
    const cleanFriend = record.friend_phone.replace(/\D/g, '');
    const cleanRef = referrerPhone.replace(/\D/g, '');
    if (cleanFriend && cleanFriend === cleanRef) {
      console.warn('Self-referral ignored');
      return {
        ...record,
        id: `ref-self-${Date.now()}`,
        created_at: new Date().toISOString()
      };
    }
  }

  const payload = {
    referrer_id: referrerId || 'unknown',
    referrer_name: referrerName || 'Cliente Cesta Fácil',
    referrer_phone: referrerPhone || '',
    referral_code: record.referral_code,
    friend_name: record.friend_name,
    friend_phone: record.friend_phone || '',
    order_id: record.order_id || null,
    order_number: record.order_number || null,
    order_total: record.order_total || 0,
    reward_amount: record.reward_amount || 0,
    discount_amount: record.discount_amount || 0,
    status: record.status || 'pending',
    notes: record.notes || '',
    payment_method: record.payment_method || null,
    installments_total: record.installments_total || 1,
    installments_paid: record.installments_paid || 0,
    reward_released: record.reward_released || 0
  };

  try {
    const { data, error } = await supabase
      .from('referrals')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      return {
        ...record,
        id: String(data.id),
        referrer_id: String(data.referrer_id || referrerId),
        referrer_name: data.referrer_name ? String(data.referrer_name) : referrerName,
        referrer_phone: data.referrer_phone ? String(data.referrer_phone) : referrerPhone,
        created_at: String(data.created_at)
      };
    }
    if (error) {
      console.warn('Error inserting referral into Supabase:', error);
    }
  } catch (err) {
    console.warn('Could not insert referral directly in Supabase table:', err);
  }

  return {
    ...record,
    referrer_id: referrerId || 'unknown',
    referrer_name: referrerName,
    referrer_phone: referrerPhone,
    id: `ref-${Date.now()}`,
    created_at: new Date().toISOString()
  };
};

/**
 * Called when an order is created.
 * Business rules:
 * - Dinheiro ou PIX: o pagamento da indicação fica PENDENTE até o pagamento no ato da entrega.
 * - Carnê: o valor é liberado proporcionalmente a cada carnê pago (ex: 4 parcelas = 10% de cada parcela paga).
 */
export const completeReferralOnOrder = async (
  buyerUser: { id: string; name?: string; phone: string },
  order: { id: string; order_number: string; total: number; payment_method?: string; installments?: number }
): Promise<void> => {
  try {
    const cleanPhone = buyerUser.phone ? buyerUser.phone.replace(/\D/g, '') : '';
    const storedCode = localStorage.getItem('cesta_referral_code') || sessionStorage.getItem('cesta_referral_code');

    const total = Number(order.total) || 0;
    const rewardTotal = Math.round(total * 0.10 * 100) / 100; // 10% do total da compra
    const rawMethod = (order.payment_method || 'money').toLowerCase();
    const isCarne = rawMethod === 'carne' || rawMethod === 'carnet' || (order.installments && order.installments > 1);
    const installmentsTotal = isCarne ? Math.max(1, Number(order.installments || 1)) : 1;

    let note = '';
    if (isCarne) {
      note = `Carnê em ${installmentsTotal}x: 10% liberado proporcionalmente a cada carnê pago (R$ ${(rewardTotal / installmentsTotal).toFixed(2).replace('.', ',')} por parcela).`;
    } else if (rawMethod === 'pix') {
      note = `PIX no ato da entrega: cashback de 10% liberado na entrega.`;
    } else if (rawMethod === 'money') {
      note = `Dinheiro no ato da entrega: cashback de 10% liberado na entrega.`;
    } else {
      note = `Pagamento via ${rawMethod}: liberação no ato da entrega.`;
    }

    // 1. Check if there is already an existing pending referral for this friend's phone
    if (cleanPhone) {
      const { data: existingRefs } = await supabase
        .from('referrals')
        .select('*')
        .eq('friend_phone', cleanPhone)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingRefs && existingRefs.length > 0) {
        const ref = existingRefs[0];
        await supabase
          .from('referrals')
          .update({
            order_id: String(order.id),
            order_number: String(order.order_number),
            order_total: total,
            reward_amount: rewardTotal,
            discount_amount: rewardTotal,
            status: 'pending', // Fica pendente até a entrega (dinheiro/pix) ou pagamento das parcelas (carnê)
            payment_method: rawMethod,
            installments_total: installmentsTotal,
            installments_paid: 0,
            reward_released: 0,
            notes: note,
            updated_at: new Date().toISOString()
          })
          .eq('id', ref.id);

        localStorage.removeItem('cesta_referral_code');
        sessionStorage.removeItem('cesta_referral_code');
        return;
      }
    }

    // 2. If no pending referral was created on signup, but a referral code is stored in browser:
    if (storedCode) {
      const resolved = await resolveReferrerByCode(storedCode);

      // Prevent self-referral
      if (resolved && cleanPhone && resolved.phone.replace(/\D/g, '') === cleanPhone) {
        localStorage.removeItem('cesta_referral_code');
        return;
      }

      await supabase.from('referrals').insert([{
        referrer_id: resolved ? resolved.id : 'unknown',
        referrer_name: resolved ? resolved.name : 'Cliente Cesta Fácil',
        referrer_phone: resolved ? resolved.phone : '',
        referral_code: storedCode,
        friend_name: buyerUser.name || 'Amigo Indicado',
        friend_phone: buyerUser.phone,
        order_id: String(order.id),
        order_number: String(order.order_number),
        order_total: total,
        reward_amount: rewardTotal,
        discount_amount: rewardTotal,
        status: 'pending',
        payment_method: rawMethod,
        installments_total: installmentsTotal,
        installments_paid: 0,
        reward_released: 0,
        notes: note
      }]);

      localStorage.removeItem('cesta_referral_code');
      sessionStorage.removeItem('cesta_referral_code');
    }
  } catch (err) {
    console.error('Error completing referral on order:', err);
  }
};

/**
 * Called when an order is delivered (marcado como 'entregue').
 * Se for Dinheiro, PIX ou Cartão: confirma o pagamento no ato da entrega e LIBERA 100% do cashback!
 * Se for Carnê: o cashback continuará sendo liberado conforme as parcelas do carnê forem sendo pagas.
 */
export const onOrderDelivered = async (orderNumberOrId: string): Promise<void> => {
  if (!orderNumberOrId) return;

  try {
    const { data: refs } = await supabase
      .from('referrals')
      .select('*')
      .or(`order_number.eq.${orderNumberOrId},order_id.eq.${orderNumberOrId}`)
      .limit(1);

    if (refs && refs.length > 0) {
      const ref = refs[0];
      const rawMethod = (ref.payment_method || '').toLowerCase();
      const isCarne = rawMethod === 'carne' || rawMethod === 'carnet' || (ref.installments_total && ref.installments_total > 1);

      if (!isCarne) {
        // Dinheiro ou PIX: liberado 100% no ato da entrega!
        const fullReward = Number(ref.reward_amount || 0);
        await supabase
          .from('referrals')
          .update({
            status: 'completed',
            reward_released: fullReward,
            notes: `Pagamento confirmado no ato da entrega (${rawMethod === 'pix' ? 'PIX' : rawMethod === 'money' ? 'Dinheiro' : 'Entrega'}). 10% de cashback liberado!`,
            updated_at: new Date().toISOString()
          })
          .eq('id', ref.id);
      }
    }
  } catch (err) {
    console.warn('Error in onOrderDelivered for referral:', err);
  }
};

/**
 * Called when an installment of a carnet is paid.
 * Libera 10% proporcional a cada carnê pago!
 * Exemplo: 4 parcelas = cada parcela paga libera 1/4 do cashback (10% daquela parcela).
 */
export const registerInstallmentPaidForReferral = async (
  orderNumberOrId: string
): Promise<{ success: boolean; paidCount: number; totalCount: number; released: number } | null> => {
  if (!orderNumberOrId) return null;

  try {
    const { data: refs } = await supabase
      .from('referrals')
      .select('*')
      .or(`order_number.eq.${orderNumberOrId},order_id.eq.${orderNumberOrId}`)
      .limit(1);

    if (refs && refs.length > 0) {
      const ref = refs[0];
      const totalInstallments = Math.max(1, Number(ref.installments_total || 1));
      const currentPaid = Number(ref.installments_paid || 0);
      const newPaid = Math.min(totalInstallments, currentPaid + 1);

      const rewardTotal = Number(ref.reward_amount || 0);
      const newReleased = Math.round((newPaid / totalInstallments) * rewardTotal * 100) / 100;
      const isAllPaid = newPaid >= totalInstallments;

      await supabase
        .from('referrals')
        .update({
          installments_paid: newPaid,
          reward_released: newReleased,
          status: isAllPaid ? 'completed' : 'pending',
          notes: `Carnê: ${newPaid}/${totalInstallments} parcelas pagas. R$ ${newReleased.toFixed(2).replace('.', ',')} de cashback liberados.`,
          updated_at: new Date().toISOString()
        })
        .eq('id', ref.id);

      return {
        success: true,
        paidCount: newPaid,
        totalCount: totalInstallments,
        released: newReleased
      };
    }
  } catch (err) {
    console.warn('Error in registerInstallmentPaidForReferral:', err);
  }

  return null;
};

export const updateReferralStatusInSupabase = async (
  id: string,
  status: ReferralRecord['status']
): Promise<boolean> => {
  let success = false;
  try {
    const updatePayload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'paid') {
      updatePayload.paid_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from('referrals')
      .update(updatePayload)
      .eq('id', id);

    if (!error) success = true;
  } catch (err) {
    console.warn('Could not update referral in Supabase:', err);
  }

  return success;
};
