'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { maskZip } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import type { AddressData } from '@/types'

const schema = z.object({
  zipCode:      z.string().min(9, 'CEP inválido.'),
  street:       z.string().min(3, 'Rua obrigatória.'),
  number:       z.string().min(1, 'Número obrigatório.'),
  complement:   z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro obrigatório.'),
  city:         z.string().min(2, 'Cidade obrigatória.'),
  state:        z.string().length(2, 'Estado inválido.'),
})

interface Props {
  defaultValues?: AddressData
  onNext: (data: AddressData) => void
  onBack: () => void
}

export default function AddressStep({ defaultValues, onNext, onBack }: Props) {
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError]   = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const zipValue = watch('zipCode')

  useEffect(() => {
    const clean = zipValue?.replace(/\D/g, '') ?? ''
    if (clean.length !== 8) return

    setCepLoading(true)
    setCepError('')

    fetch(`/api/cep/${clean}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setCepError(data.error); return }
        if (data.street)       setValue('street',       data.street)
        if (data.neighborhood) setValue('neighborhood', data.neighborhood)
        if (data.city)         setValue('city',         data.city)
        if (data.state)        setValue('state',        data.state)
      })
      .catch(() => setCepError('Erro ao buscar CEP.'))
      .finally(() => setCepLoading(false))
  }, [zipValue, setValue])

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <h2
        className="font-serif text-2xl font-light text-dark mb-1"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        Endereço de entrega
      </h2>
      <p className="text-[0.78rem] text-alluri-muted mb-6">
        Informe onde deseja receber seu pedido.
      </p>

      {/* CEP */}
      <div className="mb-4">
        <div className="relative">
          <Input
            label="CEP"
            placeholder="00000-000"
            maxLength={9}
            required
            error={errors.zipCode?.message || cepError}
            {...register('zipCode', {
              onChange: (e) => setValue('zipCode', maskZip(e.target.value)),
            })}
          />
          {cepLoading && (
            <span className="absolute right-3 top-[2.1rem] text-gold">
              <Spinner size={14} />
            </span>
          )}
        </div>
        <a
          href="https://buscacepinter.correios.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.65rem] text-alluri-muted underline mt-1 inline-block"
        >
          Não sei meu CEP
        </a>
      </div>

      {/* Logradouro + Número */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="sm:col-span-2">
          <Input
            label="Rua / Avenida"
            placeholder="Ex: Rua das Flores"
            required
            error={errors.street?.message}
            {...register('street')}
          />
        </div>
        <Input
          label="Número"
          placeholder="Ex: 123"
          required
          error={errors.number?.message}
          {...register('number')}
        />
      </div>

      {/* Complemento + Bairro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input
          label="Complemento"
          placeholder="Apto, bloco... (opcional)"
          {...register('complement')}
        />
        <Input
          label="Bairro"
          placeholder="Ex: Centro"
          required
          error={errors.neighborhood?.message}
          {...register('neighborhood')}
        />
      </div>

      {/* Cidade + Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="sm:col-span-2">
          <Input
            label="Cidade"
            placeholder="Ex: São Paulo"
            required
            error={errors.city?.message}
            {...register('city')}
          />
        </div>
        <Input
          label="Estado (UF)"
          placeholder="SP"
          maxLength={2}
          required
          error={errors.state?.message}
          {...register('state', {
            onChange: (e) => setValue('state', e.target.value.toUpperCase()),
          })}
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Voltar
        </Button>
        <Button type="submit" variant="primary" fullWidth>
          Continuar — Pagamento →
        </Button>
      </div>
    </form>
  )
}
