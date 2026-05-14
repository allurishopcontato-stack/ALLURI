'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isValidCpf, maskCpf, maskPhone } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { PersonalData } from '@/types'

const schema = z.object({
  firstName: z.string().min(2, 'Nome muito curto.'),
  lastName:  z.string().min(2, 'Sobrenome muito curto.'),
  email:     z.string().email('E-mail inválido.'),
  cpf:       z.string().refine((v) => isValidCpf(v), 'CPF inválido.'),
  phone:     z.string().min(14, 'Telefone inválido.'),
})

interface Props {
  defaultValues?: PersonalData
  onNext: (data: PersonalData) => void
}

export default function PersonalStep({ defaultValues, onNext }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PersonalData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <h2
        className="font-serif text-2xl font-light text-dark mb-1"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        Seus dados
      </h2>
      <p className="text-[0.78rem] text-alluri-muted mb-6">
        Usamos apenas para confirmar e entregar seu pedido.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input
          label="Nome"
          placeholder="Ex: Ana"
          required
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Sobrenome"
          placeholder="Ex: Silva"
          required
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="CPF"
          placeholder="000.000.000-00"
          maxLength={14}
          required
          error={errors.cpf?.message}
          {...register('cpf', {
            onChange: (e) => setValue('cpf', maskCpf(e.target.value)),
          })}
        />
      </div>

      <div className="mb-6">
        <Input
          label="Telefone / WhatsApp"
          placeholder="(11) 99999-9999"
          maxLength={15}
          required
          error={errors.phone?.message}
          {...register('phone', {
            onChange: (e) => setValue('phone', maskPhone(e.target.value)),
          })}
        />
      </div>

      <Button type="submit" variant="primary" fullWidth>
        Continuar — Endereço →
      </Button>
    </form>
  )
}
