'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ThemeSwitch from './theme-switch'
import PwaInstall from './pwa-install'
import { WARUNG_TYPES } from '@/lib/types'

function Icon({ name }: { name: 'note' | 'arrow' | 'check' | 'bulb' | 'store' | 'chevron' }) {
  const paths: Record<typeof name, ReactNode> = {
    note: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3v3m6-3v3M9 11h6m-6 4h4"/></>,
    arrow: <path d="M4 12h15m-5-5 5 5-5 5"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    bulb: <><path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/><path d="M12 1v1M3 5l1 1m16-1-1 1"/></>,
    store: <><path d="m3 9 2-5h14l2 5M3 9a3 3 0 0 0 4 3 3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 4-3ZM5 13v7h14v-7M9 20v-5h6v5"/></>,
    chevron: <path d="m9 5 7 7-7 7"/>,
  }
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const textFields = [
  { name: 'main_pain_point', label: 'Pain point utama', hint: 'Apa kesulitan yang paling dirasakan pemilik warung?', placeholder: 'Misalnya, pencatatan masih manual dan sering salah hitung.' },
  { name: 'most_requested_feature', label: 'Fitur paling diminati', hint: 'Fitur apa yang paling menarik bagi mereka?', placeholder: 'Misalnya, laporan penjualan harian atau pengingat utang.' },
  { name: 'objection', label: 'Keberatan', hint: 'Apa yang membuat mereka ragu untuk mencoba?', placeholder: 'Misalnya, belum terbiasa dengan aplikasi atau biaya langganan.' },
] as const

const emptyForm = () => ({
  observation_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
  warung_type: '', main_pain_point: '', most_requested_feature: '', objection: '',
  willing_to_try: 'Y' as 'Y' | 'T', notes: '',
})

export default function ObservationForm() {
  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const complete = [formData.observation_date, formData.warung_type, formData.main_pain_point.trim(), formData.most_requested_feature.trim(), formData.objection.trim(), formData.willing_to_try].filter(Boolean).length
  const sections = [Boolean(formData.observation_date && formData.warung_type), Boolean(formData.main_pain_point.trim() && formData.most_requested_feature.trim() && formData.objection.trim()), Boolean(formData.willing_to_try)]

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    if (submitStatus !== 'idle') setSubmitStatus('idle')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    const newErrors: Record<string, string> = {}
    if (!formData.observation_date) newErrors.observation_date = 'Tanggal observasi wajib diisi'
    if (!formData.warung_type) newErrors.warung_type = 'Jenis warung wajib dipilih'
    for (const field of textFields) {
      if (!formData[field.name].trim()) newErrors[field.name] = `${field.label} wajib diisi`
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length) {
      document.getElementById(Object.keys(newErrors)[0])?.focus()
      return
    }
    setIsSubmitting(true)
    setSubmitStatus('idle')
    try {
      const response = await fetch('/api/observations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan data')
      setSubmitStatus('success')
      setFormData(emptyForm())
      setErrors({})
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#observation-form">Langsung ke formulir</a>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="FieldObserver beranda"><span className="brand-mark"><Image src="/logo_square.png" alt="" width={37} height={37} /></span><span>field<span className="brand-light">observer</span><span className="brand-period">.</span></span></Link>
        <div className="workspace-label"><span className="status-dot" /> Ruang kerja lapangan</div>
        <div className="header-actions"><span className="internal-badge">Internal · WarungKu</span><PwaInstall /><ThemeSwitch /></div>
      </header>
      <main className="workspace">
        <div className="breadcrumb">Ruang kerja <Icon name="chevron" /><span>Observasi baru</span></div>
        <div className="page-heading"><div><p className="eyebrow">DARI LAPANGAN, UNTUK PERUBAHAN</p><h1>Setiap obrolan, <span>sebuah insight.</span></h1><p className="page-description">Catat cerita dan kebutuhan warung dari kunjunganmu hari ini.</p></div><span className="heading-tag"><Icon name="note" /> Observasi harian</span></div>
        <div className="content-grid">
          <div className="form-column">
            <div className="form-topline"><div className="form-title"><span className="small-icon"><Icon name="note" /></span><div><h2>Observasi baru</h2><p>Satu formulir untuk satu kunjungan warung.</p></div></div><span className="required-note"><span>*</span> Wajib diisi</span></div>
            <div aria-live="polite" aria-atomic="true">
              {submitStatus === 'success' && <div className="feedback success" role="status"><Icon name="check" /><div><strong>Observasi berhasil disimpan.</strong><p>Terima kasih! Kamu bisa mencatat kunjungan berikutnya.</p></div></div>}
              {submitStatus === 'error' && <div className="feedback error" role="alert"><div><strong>Observasi belum tersimpan.</strong><p>{errorMessage}</p></div></div>}
            </div>
            <form id="observation-form" onSubmit={handleSubmit} noValidate>
              <fieldset disabled={isSubmitting} className="form-fields">
                <section className="form-section" id="kunjungan" aria-labelledby="visit-title">
                  <div className="section-heading"><span className="section-number">01</span><div><h3 id="visit-title">Tentang kunjungan</h3><p>Mulai dari informasi dasar warung yang kamu temui.</p></div></div>
                  <div className="field-grid">
                    <div className="field"><label htmlFor="observation_date">Tanggal observasi <span>*</span></label><input id="observation_date" type="date" required value={formData.observation_date} onChange={e => handleChange('observation_date', e.target.value)} aria-invalid={!!errors.observation_date} aria-describedby={errors.observation_date ? 'date-error' : undefined} />{errors.observation_date && <p className="field-error" id="date-error">{errors.observation_date}</p>}</div>
                    <div className="field"><label htmlFor="warung_type">Jenis warung <span>*</span></label><select id="warung_type" required value={formData.warung_type} onChange={e => handleChange('warung_type', e.target.value)} aria-invalid={!!errors.warung_type} aria-describedby={errors.warung_type ? 'type-error' : undefined}><option value="">Pilih jenis warung</option>{WARUNG_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select>{errors.warung_type && <p className="field-error" id="type-error">{errors.warung_type}</p>}</div>
                  </div>
                </section>
                <section className="form-section" id="temuan" aria-labelledby="findings-title">
                  <div className="section-heading"><span className="section-number">02</span><div><h3 id="findings-title">Dengarkan & catat</h3><p>Tangkap hal penting dari percakapan dengan pemilik warung.</p></div></div>
                  <div className="fields-stack">{textFields.map(field => <div className="field" key={field.name}><label htmlFor={field.name}>{field.label} <span>*</span></label><p className="field-hint" id={`${field.name}-hint`}>{field.hint}</p><textarea id={field.name} required rows={3} placeholder={field.placeholder} value={formData[field.name]} onChange={e => handleChange(field.name, e.target.value)} aria-invalid={!!errors[field.name]} aria-describedby={`${field.name}-hint${errors[field.name] ? ` ${field.name}-error` : ''}`} />{errors[field.name] && <p className="field-error" id={`${field.name}-error`}>{errors[field.name]}</p>}</div>)}</div>
                </section>
                <section className="form-section last-section" id="respons" aria-labelledby="response-title">
                  <div className="section-heading"><span className="section-number">03</span><div><h3 id="response-title">Respons & catatan</h3><p>Bagaimana tanggapan mereka setelah berbincang?</p></div></div>
                  <fieldset className="choice-field"><legend>Bersedia mencoba aplikasi? <span>*</span></legend><div className="radio-grid">{(['Y', 'T'] as const).map(option => <label className={`radio-card ${formData.willing_to_try === option ? 'selected' : ''}`} key={option}><input type="radio" name="willing_to_try" value={option} checked={formData.willing_to_try === option} onChange={e => handleChange('willing_to_try', e.target.value)} /><span><strong>{option === 'Y' ? 'Ya, mau mencoba' : 'Belum bersedia'}</strong><small>{option === 'Y' ? 'Tertarik untuk mencoba aplikasi' : 'Belum ingin mencoba saat ini'}</small></span></label>)}</div></fieldset>
                  <div className="field notes-field"><label htmlFor="notes">Catatan singkat <span className="optional">Opsional</span></label><textarea id="notes" rows={3} placeholder="Ada cerita menarik atau hal lain yang perlu diingat?" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} /></div>
                </section>
                <div className="form-actions"><p>Sudah sesuai dengan hasil kunjunganmu?</p><button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? <><span className="spinner" /> Menyimpan...</> : <>Simpan observasi <Icon name="arrow" /></>}</button></div>
              </fieldset>
            </form>
          </div>
          <aside className="sidebar" aria-label="Panduan pengisian">
            <section className="progress-card"><div className="card-eyebrow">CATATAN KUNJUNGAN <span className="mini-dot" /></div><h2>Lengkapi ceritanya.</h2><p>Catatan kecilmu membantu kita memahami kebutuhan nyata di lapangan.</p><div className="progress-caption"><span>Kelengkapan formulir</span><strong>{complete}/6</strong></div><progress value={complete} max={6} aria-label="Kelengkapan formulir">{complete} dari 6</progress><nav className="section-nav" aria-label="Bagian formulir">{[{ id: 'kunjungan', label: 'Tentang kunjungan' }, { id: 'temuan', label: 'Dengarkan & catat' }, { id: 'respons', label: 'Respons & catatan' }].map((section, index) => <a href={`#${section.id}`} key={section.id}><span className={`step-dot ${sections[index] ? 'done' : ''}`}>{sections[index] ? <Icon name="check" /> : `0${index + 1}`}</span>{section.label}<Icon name="chevron" /></a>)}</nav></section>
            <section className="tips-card"><span className="tip-icon"><Icon name="bulb" /></span><p className="eyebrow">BEKAL DI LAPANGAN</p><h2>Lebih banyak mendengar, <br />lebih dalam memahami.</h2><ul><li>Gunakan bahasa pemilik warung saat mencatat kendala mereka.</li><li>Tulis jawaban yang spesifik, bukan kesimpulan umum.</li><li>Catat keberatan apa adanya. Setiap masukan itu berharga.</li></ul><div className="tip-bottom"><Icon name="store" /><span>Kenali warungnya.<br /><strong>Pahami ceritanya.</strong></span></div></section>
            <p className="sidebar-note">Dibuat untuk percakapan yang bermakna,<br />satu warung pada satu waktu.</p>
          </aside>
        </div>
        <footer className="page-footer"><span>fieldobserver<span className="brand-period">.</span> <span className="footer-divider">/</span> Catatan yang membawa perubahan.</span><span>Untuk tim lapangan WarungKu</span></footer>
      </main>
    </div>
  )
}
