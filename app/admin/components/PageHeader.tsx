import type { ReactNode } from "react";

/**
 * Encabezado común de las pantallas del panel. En celular el título ya va en la
 * cabecera fija, así que aquí queda solo para lectores de pantalla (salvo que la
 * pantalla pida mostrarlo) y la descripción se muestra solo si aporta algo allí.
 */
export function PageHeader({
  title,
  description,
  mobileDescription,
  actions,
  showTitleOnMobile = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Texto corto para celular; si no se da, la descripción no se muestra en celular. */
  mobileDescription?: ReactNode;
  actions?: ReactNode;
  showTitleOnMobile?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className={showTitleOnMobile ? "min-w-0" : "min-w-0 max-lg:sr-only"}>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a3039] sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 hidden max-w-2xl text-sm text-[#5f7a75] lg:block">{description}</p>}
      </div>
      {mobileDescription && <p className="w-full text-sm leading-snug text-[#5f7a75] lg:hidden">{mobileDescription}</p>}
      {actions && <div className="flex flex-wrap items-center gap-2 max-lg:w-full">{actions}</div>}
    </div>
  );
}
