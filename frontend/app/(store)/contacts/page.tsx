'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactsPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error('Заповніть всі поля');
      return;
    }
    setSending(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message }),
      });
      toast.success("Повідомлення відправлено! Ми зв'яжемося з вами найближчим часом.");
      setName(''); setPhone(''); setMessage('');
    } catch {
      toast.error('Помилка відправки. Спробуйте ще раз.');
    } finally {
      setSending(false);
    }
  };

  const contactItems = [
    {
      icon: Phone,
      label: 'Телефон',
      content: (
        <div className="flex flex-col gap-0.5">
          <a href="tel:+380957162055" style={{ color: 'var(--sl-accent)' }}>+380 (95) 716-20-55</a>
          <a href="tel:+380689410560" style={{ color: 'var(--sl-accent)' }}>+380 (68) 941-05-60</a>
        </div>
      ),
    },
    { icon: Mail, label: 'Email', content: <a href="mailto:smartline.if@gmail.com" style={{ color: 'var(--sl-accent)' }}>smartline.if@gmail.com</a> },
    {
      icon: Clock,
      label: 'Графік роботи',
      content: (
        <>
          <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Пн–Пт: 11:00–18:00</p>
          <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Сб: 11:00–17:00</p>
          <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Нд: вихідний</p>
        </>
      ),
    },
    {
      icon: MapPin,
      label: 'Адреса',
      content: <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>м. Івано-Франківськ, вул. Галицька 112Д,<br />маг №17 (ТЦ Щедрик)</p>,
    },
  ];

  const inputStyle = {
    background: 'var(--sl-bg-elevated)',
    border: '1px solid var(--sl-border)',
    color: 'var(--sl-text-primary)',
    fontFamily: 'var(--sl-font-body)',
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1
          className="mb-2 text-4xl sm:text-5xl"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          КОНТАКТИ
        </h1>
        <p className="mb-10 text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
          Ми завжди готові відповісти на ваші запитання
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact info */}
          <div>
            <div className="mb-8 space-y-5">
              {contactItems.map(({ icon: Icon, label, content }) => (
                <div key={label} className="flex items-start gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)' }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p
                      className="font-medium text-sm"
                      style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
                    >
                      {label}
                    </p>
                    {content}
                  </div>
                </div>
              ))}
            </div>

            {/* Google Maps embed */}
            <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--sl-border)' }}>
              <iframe
                src="https://maps.google.com/maps?q=%D0%A2%D0%A6+%D0%A9%D0%B5%D0%B4%D1%80%D0%B8%D0%BA+%D0%86%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D1%96%D0%B2%D1%81%D1%8C%D0%BA&output=embed&hl=uk"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="SmartLine на карті"
              />
            </div>
          </div>

          {/* Contact form */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <h2
              className="mb-5 text-xl font-semibold"
              style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
            >
              Напишіть нам
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Ваше ім'я *", value: name, onChange: setName, placeholder: 'Іван Іваненко', type: 'text' },
                { label: 'Телефон *', value: phone, onChange: setPhone, placeholder: '+380XXXXXXXXX', type: 'tel' },
              ].map((field) => (
                <div key={field.label}>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="h-11 w-full rounded-xl px-3 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
                  />
                </div>
              ))}
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  Повідомлення *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Ваше запитання..."
                  className="w-full resize-none rounded-xl px-3 py-3 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: sending ? 'var(--sl-bg-elevated)' : 'var(--sl-accent)',
                  color: sending ? 'var(--sl-text-muted)' : '#fff',
                  fontFamily: 'var(--sl-font-mono)',
                  cursor: sending ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!sending) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)'; }}
                onMouseLeave={(e) => { if (!sending) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)'; }}
              >
                {sending ? 'Відправка...' : 'Відправити'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
