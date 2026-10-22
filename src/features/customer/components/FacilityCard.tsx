import { ArrowUpRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Facility } from '@/features/customer/api/types'

const fallbackImage =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'

export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-[0_14px_40px_-34px_rgba(20,50,31,.32)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-34px_rgba(20,50,31,.46)] motion-reduce:transform-none">
      <Link
        to={`/facilities/${facility.id}`}
        aria-label={`Xem chi tiết ${facility.name}`}
        className="block aspect-[1.65] overflow-hidden bg-muted focus-visible:outline-primary"
      >
        <img
          src={facility.images[0] || fallbackImage}
          alt={facility.images[0] ? `Cơ sở ${facility.name}` : ''}
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-[1.035] motion-reduce:transform-none"
        />
      </Link>
      <div className="p-5 sm:p-6">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MapPin size={14} className="text-primary" /> {facility.city}
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          {facility.name}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
          {facility.address}
        </p>
        <Link
          to={`/facilities/${facility.id}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
        >
          Xem chi tiết <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  )
}
