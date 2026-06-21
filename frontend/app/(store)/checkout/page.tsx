'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  ExternalLink,
  Home,
  Mail,
  MapPin,
  Package,
  Phone,
  Store,
  Truck,
  User,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { createOrder, getMe, getWarehouses, searchCities, searchStreets } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { User as UserType } from '@/types';

type DeliveryProvider = 'nova_poshta' | 'pickup';
type NovaPoshtaMode = 'warehouse' | 'address';
type DeliveryType = 'nova_poshta_branch' | 'nova_poshta_address' | 'pickup';
type PaymentMethod = 'online' | 'bank_transfer' | 'cod';

type NovaPoshtaCity = {
  Present?: string;
  MainDescription?: string;
  DeliveryCity?: string;
  Ref?: string;
  Area?: string;
  Region?: string;
  SettlementTypeCode?: string;
};

type NovaPoshtaWarehouse = {
  Ref: string;
  Description?: string;
  DescriptionRu?: string;
  Number?: string;
  TypeOfWarehouse?: string;
};

type NovaPoshtaStreet = {
  Ref: string;
  Description?: string;
  StreetsType?: string;
  StreetsTypeRef?: string;
};

const steps = ['Контакти', 'Доставка', 'Оплата', 'Підтвердження'];

const paymentLabels: Record<PaymentMethod, string> = {
  online: 'Онлайн оплата',
  bank_transfer: 'На розрахунковий рахунок',
  cod: 'Накладений платіж',
};

const pickupAddress = 'Івано-Франківськ, вул. Галицька 112д, ТЦ «Щедрик», 17 магазин';
const popularCities = ['Івано-Франківськ', 'Київ', 'Львів', 'Одеса'];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, totalItems } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserType | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [deliveryProvider, setDeliveryProvider] = useState<DeliveryProvider>('nova_poshta');
  const [npMode, setNpMode] = useState<NovaPoshtaMode>('warehouse');
  const [cityQuery, setCityQuery] = useState('');
  const [cityFocused, setCityFocused] = useState(false);
  const [citySearching, setCitySearching] = useState(false);
  const [cities, setCities] = useState<NovaPoshtaCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<NovaPoshtaCity | null>(null);
  const [warehouses, setWarehouses] = useState<NovaPoshtaWarehouse[]>([]);
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [warehouseFocused, setWarehouseFocused] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<NovaPoshtaWarehouse | null>(null);
  const [street, setStreet] = useState('');
  const [streetFocused, setStreetFocused] = useState(false);
  const [streets, setStreets] = useState<NovaPoshtaStreet[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<NovaPoshtaStreet | null>(null);
  const [streetSearchError, setStreetSearchError] = useState<string | null>(null);
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [intercom, setIntercom] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [citySearchError, setCitySearchError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const citySearchIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((user) => {
        if (cancelled) return;
        setProfile(user);
        setName((current) => current || user.name || '');
        setPhone((current) => current || user.phone || '');
        setEmail((current) => current || user.email || '');
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const deliveryType: DeliveryType = deliveryProvider === 'pickup'
    ? 'pickup'
    : npMode === 'address'
      ? 'nova_poshta_address'
      : 'nova_poshta_branch';

  const filteredWarehouses = useMemo(() => {
    const query = warehouseQuery.trim().toLowerCase();
    if (!query) return warehouses.slice(0, 80);
    return warehouses
      .filter((warehouse) => (warehouse.Description || '').toLowerCase().includes(query))
      .slice(0, 80);
  }, [warehouseQuery, warehouses]);

  const cityFallbackSuggestions = useMemo(() => {
    const query = cityQuery.trim().toLowerCase();
    if (!query) return popularCities;
    return popularCities.filter((city) => city.toLowerCase().includes(query));
  }, [cityQuery]);

  const handleCitySearch = async (query: string) => {
    const searchId = citySearchIdRef.current + 1;
    citySearchIdRef.current = searchId;
    setCityQuery(query);
    setSelectedCity(null);
    setSelectedWarehouse(null);
    setSelectedStreet(null);
    setStreets([]);
    setStreet('');
    setWarehouseQuery('');
    setCitySearchError(null);
    if (query.trim().length < 2) {
      setCities([]);
      setCitySearching(false);
      return;
    }

    try {
      setCitySearching(true);
      const data = await searchCities(query);
      if (citySearchIdRef.current !== searchId) return;
      setCities(data);
    } catch {
      if (citySearchIdRef.current !== searchId) return;
      setCitySearchError('Не вдалося знайти місто. Спробуйте ще раз.');
      setCities([]);
    } finally {
      if (citySearchIdRef.current === searchId) {
        setCitySearching(false);
      }
    }
  };

  const handleCitySelect = async (city: NovaPoshtaCity) => {
    setSelectedCity(city);
    setSelectedWarehouse(null);
    setSelectedStreet(null);
    setStreets([]);
    setStreet('');
    setWarehouseQuery('');
    setCityQuery(city.Present || city.MainDescription || '');
    setCities([]);
    setDeliveryError(null);

    const cityRef = city.DeliveryCity || city.Ref;
    if (!cityRef) return;

    try {
      const data = await getWarehouses(cityRef);
      setWarehouses(data);
    } catch {
      setCitySearchError('Не вдалося завантажити відділення Нової пошти.');
      setWarehouses([]);
    }
  };

  const handleStreetSearch = async (query: string) => {
    setStreet(query);
    setSelectedStreet(null);
    setStreetSearchError(null);

    const cityRef = selectedCity?.Ref || selectedCity?.DeliveryCity;
    if (!cityRef || query.trim().length < 2) {
      setStreets([]);
      return;
    }

    try {
      const data = await searchStreets(cityRef, query);
      setStreets(data);
    } catch {
      setStreetSearchError('Не вдалося знайти вулицю в довіднику Нової пошти.');
      setStreets([]);
    }
  };

  const handleStreetSelect = (streetItem: NovaPoshtaStreet) => {
    setSelectedStreet(streetItem);
    setStreet(streetItem.Description || '');
    setStreets([]);
    setDeliveryError(null);
  };

  const validateContacts = () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Заповніть ім'я та телефон");
      return false;
    }
    return true;
  };

  const validateDelivery = () => {
    if (deliveryProvider === 'pickup') {
      setDeliveryError(null);
      return true;
    }

    if (!selectedCity) {
      setDeliveryError('Оберіть місто зі списку Нової пошти.');
      return false;
    }

    if (npMode === 'warehouse' && !selectedWarehouse) {
      setDeliveryError('Оберіть відділення або поштомат Нової пошти.');
      return false;
    }

    if (npMode === 'address' && (!selectedStreet || !building.trim())) {
      setDeliveryError('Для адресної доставки оберіть вулицю з довідника НП та вкажіть будинок.');
      return false;
    }

    setDeliveryError(null);
    return true;
  };

  const buildDeliveryPayload = () => {
    const cityName = selectedCity?.Present || selectedCity?.MainDescription || '';
    const cityRef = selectedCity?.DeliveryCity || selectedCity?.Ref || '';

    if (deliveryProvider === 'pickup') {
      return {
        type: 'pickup',
        provider: 'pickup',
        method: 'Самовивіз',
        serviceType: 'Pickup',
        city: 'Івано-Франківськ',
        cityName: 'Івано-Франківськ',
        address: pickupAddress,
        pickupPoint: pickupAddress,
        recipientName: name,
        recipientPhone: phone,
        note: deliveryNote || undefined,
      };
    }

    if (npMode === 'address') {
      return {
        type: 'nova_poshta_address',
        provider: 'nova_poshta',
        method: 'Адресна доставка Новою поштою',
        serviceType: 'WarehouseDoors',
        city: cityName,
        cityName,
        cityRef,
        settlementRef: selectedCity?.Ref,
        area: selectedCity?.Area,
        region: selectedCity?.Region,
        recipientName: name,
        recipientPhone: phone,
        street: selectedStreet?.Description || street,
        streetRef: selectedStreet?.Ref,
        streetType: selectedStreet?.StreetsType,
        building,
        apartment: apartment || undefined,
        entrance: entrance || undefined,
        floor: floor || undefined,
        intercom: intercom || undefined,
        address: [selectedStreet?.Description || street, building, apartment ? `кв. ${apartment}` : null].filter(Boolean).join(', '),
        note: deliveryNote || undefined,
      };
    }

    return {
      type: 'nova_poshta_branch',
      provider: 'nova_poshta',
      method: 'Відділення або поштомат Нової пошти',
      serviceType: 'WarehouseWarehouse',
      city: cityName,
      cityName,
      cityRef,
      settlementRef: selectedCity?.Ref,
      area: selectedCity?.Area,
      region: selectedCity?.Region,
      warehouse: selectedWarehouse?.Description,
      warehouseName: selectedWarehouse?.Description,
      warehouseRef: selectedWarehouse?.Ref,
      warehouseNumber: selectedWarehouse?.Number,
      warehouseType: selectedWarehouse?.TypeOfWarehouse,
      address: selectedWarehouse?.Description,
      recipientName: name,
      recipientPhone: phone,
      note: deliveryNote || undefined,
    };
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Кошик порожній');
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        delivery: buildDeliveryPayload(),
        payment: { method: paymentMethod },
      });

      clearCart();
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Помилка оформлення замовлення');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10';
  const cardStyle = { borderColor: 'var(--sl-border)', background: 'var(--sl-bg-surface)' };
  const orderItemsCount = totalItems();

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sl-accent)' }}>
            Checkout
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--sl-text-primary)' }}>
            Оформлення замовлення
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{ color: 'var(--sl-text-muted)' }}>
            Перевіримо контакти, доставку та оплату. Якщо ви увійшли в акаунт, дані підставляються автоматично.
          </p>
        </div>

        <div className="mb-6 grid gap-2 sm:grid-cols-4">
          {steps.map((label, index) => {
            const active = index + 1 <= step;
            return (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border p-3"
                style={{
                  borderColor: active ? 'color-mix(in srgb, var(--sl-accent) 35%, var(--sl-border))' : 'var(--sl-border)',
                  background: active ? 'color-mix(in srgb, var(--sl-accent) 8%, var(--sl-bg-surface))' : 'var(--sl-bg-surface)',
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: active ? 'var(--sl-accent)' : 'var(--sl-bg-elevated)',
                    color: active ? '#fff' : 'var(--sl-text-muted)',
                  }}
                >
                  {index + 1}
                </span>
                <span className="text-sm font-semibold" style={{ color: active ? 'var(--sl-text-primary)' : 'var(--sl-text-muted)' }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border p-5 shadow-sm sm:p-6" style={cardStyle}>
            {step === 1 && (
              <div className="space-y-5">
                <SectionHeader
                  icon={<User className="h-5 w-5" />}
                  title="Контактні дані"
                  description={profile ? 'Ми вже підставили дані з вашого акаунта.' : 'Потрібні для підтвердження замовлення.'}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ім'я та прізвище" required>
                    <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Іван Іванов" />
                  </Field>
                  <Field label="Телефон" required>
                    <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380501234567" type="tel" />
                  </Field>
                  <Field label="Email" className="sm:col-span-2">
                    <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
                  </Field>
                </div>

                <div className="flex justify-end">
                  <PrimaryButton onClick={() => validateContacts() && setStep(2)}>
                    Далі <ArrowRight className="h-4 w-4" />
                  </PrimaryButton>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <SectionHeader
                  icon={<Truck className="h-5 w-5" />}
                  title="Доставка"
                  description="Оберіть Нову пошту або самовивіз. Для НП підготуємо всі потрібні дані для відправки."
                />

                <ChoiceSection eyebrow="1. Спосіб отримання">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionButton
                      active={deliveryProvider === 'nova_poshta'}
                      icon={<NovaPoshtaMark />}
                      brandIcon
                      title="Нова пошта"
                      text="Доставка у відділення, поштомат або кур'єром."
                      onClick={() => {
                        setDeliveryProvider('nova_poshta');
                        setDeliveryError(null);
                      }}
                    />
                    <OptionButton
                      active={deliveryProvider === 'pickup'}
                      icon={<Store className="h-5 w-5" />}
                      title="Самовивіз"
                      text="Івано-Франківськ, ТЦ «Щедрик»."
                      onClick={() => {
                        setDeliveryProvider('pickup');
                        setDeliveryError(null);
                      }}
                    />
                  </div>
                </ChoiceSection>

                {deliveryProvider === 'nova_poshta' ? (
                  <div className="space-y-5">
                    <ChoiceSection eyebrow="2. Деталі Нової пошти">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <OptionButton
                          active={npMode === 'warehouse'}
                          icon={<MapPin className="h-5 w-5" />}
                          title="Відділення або поштомат"
                          text="Найшвидший варіант для більшості замовлень."
                          onClick={() => {
                            setNpMode('warehouse');
                            setDeliveryError(null);
                          }}
                        />
                        <OptionButton
                          active={npMode === 'address'}
                          icon={<Home className="h-5 w-5" />}
                          title="Адресна доставка"
                          text="Кур'єр Нової пошти доставить до дверей."
                          onClick={() => {
                            setNpMode('address');
                            setDeliveryError(null);
                          }}
                        />
                      </div>
                    </ChoiceSection>

                    <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--sl-border)', background: 'var(--sl-bg-surface)' }}>
                      <div className="grid gap-5">
                        <Field label="Місто" required>
                          <div className="relative">
                            <input
                              className={inputClass}
                              value={cityQuery}
                              onChange={(e) => handleCitySearch(e.target.value)}
                              onFocus={() => setCityFocused(true)}
                              onBlur={() => setCityFocused(false)}
                              placeholder="Почніть вводити місто"
                            />
                            {cityFocused && (
                              <SuggestionPanel title={cities.length > 0 ? 'Підказки Нової пошти' : cityQuery.trim().length >= 2 ? 'Схожі міста' : 'Популярні міста'}>
                                {citySearching && (
                                  <div className="px-3 py-2 text-sm text-slate-500">Шукаємо місто в Новій пошті...</div>
                                )}
                                {cities.length > 0 && cities.map((city) => (
                                  <CitySuggestion
                                    key={`${city.Ref}-${city.Present}`}
                                    city={city}
                                    onSelect={() => {
                                      handleCitySelect(city);
                                      setCityFocused(false);
                                    }}
                                  />
                                ))}
                                {!citySearching && cities.length === 0 && cityFallbackSuggestions.length > 0 && (
                                  <div className="space-y-1">
                                    {cityFallbackSuggestions.map((city) => (
                                      <button
                                        key={city}
                                        type="button"
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition"
                                        style={{ color: 'var(--sl-text-primary)' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sl-bg-surface)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                                        onMouseDown={(event) => {
                                          event.preventDefault();
                                          handleCitySearch(city);
                                          setCityFocused(true);
                                        }}
                                      >
                                        <MapPin className="h-4 w-4 shrink-0 h-4 w-4" style={{ color: 'var(--sl-accent)' }} />
                                        {city}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {!citySearching && cities.length === 0 && cityFallbackSuggestions.length === 0 && cityQuery.trim().length >= 2 && (
                                  <div className="px-3 py-2 text-sm text-slate-500">Немає локальних підказок. Спробуйте уточнити назву міста.</div>
                                )}
                              </SuggestionPanel>
                            )}
                          </div>
                          {citySearchError && <p className="mt-2 text-sm text-red-600">{citySearchError}</p>}
                        </Field>

                        {npMode === 'warehouse' && (
                          <Field label="Відділення або поштомат" required>
                            <input
                              className={inputClass}
                              value={warehouseQuery}
                              onChange={(e) => {
                                setWarehouseQuery(e.target.value);
                                setSelectedWarehouse(null);
                              }}
                              onFocus={() => setWarehouseFocused(true)}
                              onBlur={() => setWarehouseFocused(false)}
                              placeholder={selectedCity ? 'Пошук за номером або адресою' : 'Спочатку оберіть місто'}
                              disabled={!selectedCity}
                            />
                            {selectedCity && warehouseFocused && filteredWarehouses.length > 0 && (
                              <SuggestionPanel inline title={warehouseQuery ? 'Знайдені відділення' : 'Найближчі варіанти у місті'}>
                                {filteredWarehouses.map((warehouse) => {
                                  const active = selectedWarehouse?.Ref === warehouse.Ref;
                                  return (
                                    <button
                                      key={warehouse.Ref}
                                      type="button"
                                      className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition"
                                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sl-bg-surface)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                                      style={{ background: active ? 'rgb(239 246 255)' : undefined }}
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        setSelectedWarehouse(warehouse);
                                        setWarehouseQuery(warehouse.Description || '');
                                        setDeliveryError(null);
                                        setWarehouseFocused(false);
                                      }}
                                    >
                                      <span className="flex items-start gap-3">
                                        <NovaPoshtaMark small />
                                        <span className="font-semibold" style={{ color: active ? 'var(--sl-accent)' : 'var(--sl-text-secondary)' }}>{warehouse.Description}</span>
                                      </span>
                                      {active && <Check className="mt-0.5 h-4 w-4 shrink-0 h-4 w-4" style={{ color: 'var(--sl-accent)' }} />}
                                    </button>
                                  );
                                })}
                              </SuggestionPanel>
                            )}
                          </Field>
                        )}

                        {npMode === 'address' && (
                          <div className="grid gap-4 sm:grid-cols-6">
                        <Field label="Вулиця" required className="sm:col-span-3">
                          <div className="relative">
                            <input
                              className={inputClass}
                              value={street}
                              onChange={(e) => handleStreetSearch(e.target.value)}
                              onFocus={() => setStreetFocused(true)}
                              onBlur={() => setStreetFocused(false)}
                              placeholder={selectedCity ? 'Почніть вводити вулицю' : 'Спочатку оберіть місто'}
                              disabled={!selectedCity}
                            />
                            {streetFocused && streets.length > 0 && (
                              <SuggestionPanel title="Вулиці з довідника НП">
                                {streets.map((streetItem) => (
                                  <button
                                    key={streetItem.Ref}
                                    type="button"
                                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition"
                                    style={{ color: 'var(--sl-text-primary)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sl-bg-surface)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      handleStreetSelect(streetItem);
                                      setStreetFocused(false);
                                    }}
                                  >
                                    <span className="flex items-center gap-3 font-semibold" style={{ color: 'var(--sl-text-primary)' }}>
                                      <MapPin className="h-4 w-4" style={{ color: 'var(--sl-accent)' }} />
                                      {[streetItem.StreetsType, streetItem.Description].filter(Boolean).join(' ')}
                                    </span>
                                    <Check className="h-4 w-4 shrink-0 opacity-0" style={{ color: 'var(--sl-accent)' }} />
                                  </button>
                                ))}
                              </SuggestionPanel>
                            )}
                          </div>
                          {streetSearchError && <p className="mt-2 text-sm text-red-600">{streetSearchError}</p>}
                          {selectedStreet && (
                            <p className="mt-2 text-xs font-medium" style={{ color: 'var(--sl-accent)' }}>
                              Обрано з НП: {[selectedStreet.StreetsType, selectedStreet.Description].filter(Boolean).join(' ')}
                            </p>
                          )}
                        </Field>
                        <Field label="Будинок" required className="sm:col-span-1">
                          <input className={inputClass} value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="12" />
                        </Field>
                        <Field label="Квартира" className="sm:col-span-2">
                          <input className={inputClass} value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="34" />
                        </Field>
                        <Field label="Під'їзд" className="sm:col-span-2">
                          <input className={inputClass} value={entrance} onChange={(e) => setEntrance(e.target.value)} placeholder="1" />
                        </Field>
                        <Field label="Поверх" className="sm:col-span-2">
                          <input className={inputClass} value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="5" />
                        </Field>
                        <Field label="Домофон" className="sm:col-span-2">
                          <input className={inputClass} value={intercom} onChange={(e) => setIntercom(e.target.value)} placeholder="Необов'язково" />
                        </Field>
                      </div>
                        )}

                        <Field label="Коментар до доставки">
                          <textarea
                            className="min-h-24 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            value={deliveryNote}
                            onChange={(e) => setDeliveryNote(e.target.value)}
                            placeholder="Наприклад, зателефонувати перед відправкою"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--sl-bg-elevated)', borderColor: 'var(--sl-border)' }}>
                    <div className="grid gap-0 md:grid-cols-[1fr_320px]">
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--sl-accent) 12%, var(--sl-bg-elevated))', color: 'var(--sl-accent)' }}>
                            <Store className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>Самовивіз SmartLine</h3>
                            <p className="mt-1 text-sm leading-6" style={{ color: 'var(--sl-text-muted)' }}>
                              {pickupAddress}
                            </p>
                            <a
                              href="https://www.google.com/maps/search/?api=1&query=%D0%86%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D1%96%D0%B2%D1%81%D1%8C%D0%BA%20%D0%93%D0%B0%D0%BB%D0%B8%D1%86%D1%8C%D0%BA%D0%B0%20112%D0%B4%20%D0%A2%D0%A6%20%D0%A9%D0%B5%D0%B4%D1%80%D0%B8%D0%BA"
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold"
                              style={{ color: 'var(--sl-accent)' }}
                            >
                              Відкрити в Google Maps <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                      <iframe
                        title="SmartLine pickup map"
                        className="h-56 w-full border-0 md:h-full"
                        loading="lazy"
                        src="https://www.google.com/maps?q=%D0%86%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D1%96%D0%B2%D1%81%D1%8C%D0%BA%20%D0%93%D0%B0%D0%BB%D0%B8%D1%86%D1%8C%D0%BA%D0%B0%20112%D0%B4%20%D0%A2%D0%A6%20%D0%A9%D0%B5%D0%B4%D1%80%D0%B8%D0%BA&output=embed"
                      />
                    </div>
                  </div>
                )}

                {deliveryError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{deliveryError}</p>
                )}

                <NavButtons onBack={() => setStep(1)} onNext={() => validateDelivery() && setStep(3)} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <SectionHeader
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Оплата"
                  description="Оберіть спосіб оплати, який зручний саме зараз."
                />
                <div className="grid gap-3">
                  <OptionButton
                    active={paymentMethod === 'cod'}
                    icon={<Truck className="h-5 w-5" />}
                    title="Накладений платіж"
                    text="Оплата при отриманні. Без передоплати."
                    onClick={() => setPaymentMethod('cod')}
                  />
                  <OptionButton
                    active={paymentMethod === 'bank_transfer'}
                    icon={<Wallet className="h-5 w-5" />}
                    title="На розрахунковий рахунок"
                    text="Реквізити надішлемо після підтвердження замовлення."
                    onClick={() => setPaymentMethod('bank_transfer')}
                  />
                </div>
                <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <SectionHeader
                  icon={<Check className="h-5 w-5" />}
                  title="Підтвердження"
                  description="Перевірте деталі перед створенням замовлення."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryCard title="Покупець" rows={[
                    ["Ім'я", name],
                    ['Телефон', phone],
                    ...(email ? [['Email', email]] : []),
                  ]} />
                  <SummaryCard title="Доставка" rows={[
                    ['Спосіб', deliveryProvider === 'pickup' ? 'Самовивіз' : npMode === 'address' ? 'НП, адресна' : 'НП, відділення'],
                    ['Місто', deliveryProvider === 'pickup' ? 'Івано-Франківськ' : cityQuery],
                    ['Адреса', deliveryProvider === 'pickup' ? pickupAddress : npMode === 'address' ? [selectedStreet?.Description || street, building, apartment].filter(Boolean).join(', ') : selectedWarehouse?.Description || ''],
                  ]} />
                  <SummaryCard title="Оплата" rows={[
                    ['Метод', paymentLabels[paymentMethod]],
                    ['Товарів', `${orderItemsCount} шт.`],
                  ]} />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <SecondaryButton onClick={() => setStep(3)}>
                    <ArrowLeft className="h-4 w-4" /> Назад
                  </SecondaryButton>
                  <PrimaryButton onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Оформлюємо...' : 'Підтвердити замовлення'}
                    {!loading && <Check className="h-4 w-4" />}
                  </PrimaryButton>
                </div>
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border p-5 shadow-sm lg:sticky lg:top-24" style={cardStyle}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--sl-text-primary)' }}>Ваше замовлення</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--sl-text-muted)' }}>Товарів у кошику</span>
                <span className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>{orderItemsCount} шт.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--sl-text-muted)' }}>Доставка</span>
                <span className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>
                  {deliveryProvider === 'pickup' ? 'Самовивіз' : 'Нова пошта'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--sl-text-muted)' }}>Оплата</span>
                <span className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>{paymentLabels[paymentMethod]}</span>
              </div>
              {paymentMethod === 'bank_transfer' && (
                <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'color-mix(in srgb, var(--sl-accent) 30%, transparent)', background: 'color-mix(in srgb, var(--sl-accent) 8%, var(--sl-bg-surface))', color: 'var(--sl-text-secondary)' }}>
                  Реквізити для оплати надішлемо в SMS або Telegram після підтвердження замовлення.
                </div>
              )}
            </div>
            <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--sl-border)' }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--sl-text-muted)' }}>
                <Phone className="h-4 w-4" />
                Менеджер підтвердить деталі після оформлення.
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: 'var(--sl-text-muted)' }}>
                <Mail className="h-4 w-4" />
                Статус замовлення буде в особистому кабінеті.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--sl-accent) 12%, var(--sl-bg-elevated))', color: 'var(--sl-accent)' }}>{icon}</div>
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--sl-text-primary)' }}>{title}</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>{description}</p>
      </div>
    </div>
  );
}

function Field({ label, required, className = '', children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-semibold" style={{ color: 'var(--sl-text-secondary)' }}>
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}

function ChoiceSection({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--sl-border)', background: 'var(--sl-bg-elevated)' }}>
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--sl-text-muted)' }}>
        {eyebrow}
      </p>
      {children}
    </div>
  );
}

function SuggestionPanel({ title, inline = false, children }: { title: string; inline?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={[
        inline ? 'mt-2' : 'absolute z-20 mt-2',
        'max-h-72 w-full overflow-y-auto rounded-xl border p-1 shadow-xl',
      ].join(' ')}
      style={{ background: 'var(--sl-bg-elevated)', borderColor: 'var(--sl-border)' }}
    >
      <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--sl-text-muted)' }}>{title}</p>
      {children}
    </div>
  );
}

function CitySuggestion({ city, onSelect }: { city: NovaPoshtaCity; onSelect: () => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition"
      style={{ color: 'var(--sl-text-primary)' }}
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect();
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sl-bg-surface)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--sl-accent)' }} />
      <span className="flex flex-col">
        <span className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>{city.Present || city.MainDescription}</span>
        {(city.Area || city.Region) && (
          <span className="text-xs" style={{ color: 'var(--sl-text-muted)' }}>{[city.Area, city.Region].filter(Boolean).join(', ')}</span>
        )}
      </span>
    </button>
  );
}

function NovaPoshtaMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? 24 : 40}
      height={small ? 24 : 40}
      viewBox="0 0 40 40"
      fill="none"
      className="shrink-0"
      aria-label="Нова пошта"
      role="img"
    >
      <rect width="40" height="40" rx="10" fill="#E30613" />
      <path d="M20 7.5 14.2 13.3h3.6v13.4h-3.6L20 32.5l5.8-5.8h-3.6V13.3h3.6L20 7.5Z" fill="white" />
      <path d="M7.5 20 13.3 14.2v3.6h13.4v-3.6L32.5 20l-5.8 5.8v-3.6H13.3v3.6L7.5 20Z" fill="white" />
    </svg>
  );
}

function OptionButton({
  active,
  icon,
  brandIcon = false,
  title,
  text,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  brandIcon?: boolean;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-checked={active}
      role="radio"
      className="relative grid min-h-32 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: active ? 'var(--sl-accent)' : 'var(--sl-border)',
        background: active ? 'color-mix(in srgb, var(--sl-accent) 9%, var(--sl-bg-surface))' : 'var(--sl-bg-surface)',
        color: 'var(--sl-text-primary)',
      }}
    >
      <span
        className="col-start-3 row-start-1 flex h-5 w-5 items-center justify-center self-center rounded-full border-2 transition"
        style={{ background: 'var(--sl-bg-elevated)', borderColor: active ? 'var(--sl-accent)' : 'var(--sl-border)' }}
      >
        {active && <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--sl-accent)' }} />}
      </span>
      <span
        className="col-start-1 row-start-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: brandIcon ? 'transparent' : active ? 'var(--sl-accent)' : 'var(--sl-bg-elevated)',
          color: brandIcon ? 'inherit' : active ? '#fff' : 'var(--sl-text-secondary)',
        }}
      >
        {icon}
      </span>
      <span className="col-start-2 row-start-1 min-w-0 pr-2">
        <span className="block font-semibold">{title}</span>
        <span className="mt-1.5 block text-sm leading-6" style={{ color: 'var(--sl-text-muted)' }}>{text}</span>
      </span>
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: 'var(--sl-accent)' }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-6 text-sm font-bold transition hover:bg-slate-50"
      style={{ borderColor: 'var(--sl-border)', color: 'var(--sl-text-secondary)', background: 'var(--sl-bg-surface)' }}
    >
      {children}
    </button>
  );
}

function NavButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <SecondaryButton onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Назад
      </SecondaryButton>
      <PrimaryButton onClick={onNext}>
        Далі <ArrowRight className="h-4 w-4" />
      </PrimaryButton>
    </div>
  );
}

function SummaryCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--sl-border)', background: 'var(--sl-bg-elevated)' }}>
      <h3 className="font-bold" style={{ color: 'var(--sl-text-primary)' }}>{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-3 text-sm">
            <span className="w-24 shrink-0" style={{ color: 'var(--sl-text-muted)' }}>{label}</span>
            <span className="font-medium" style={{ color: 'var(--sl-text-primary)' }}>{value || 'Не вказано'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
