import Link from "next/link";

/**
 * Cinta de alerta (amarilla con letras negras) con el texto desplazándose.
 * Es un enlace a los planes. El texto va duplicado para que el bucle no tenga corte;
 * la copia es aria-hidden para que los lectores de pantalla lo lean una sola vez.
 */
export function UrgencyTape({ message }: { message: string }) {
  const items = Array.from({ length: 4 }, (_, i) => (
    <span key={i} className="urgency-tape-item">
      <span aria-hidden="true" className="urgency-tape-icon">⚠</span>
      {message}
    </span>
  ));
  return (
    <Link href="#inscribirme" className="urgency-tape" aria-label={message}>
      <span className="urgency-tape-track" aria-hidden="true">
        <span className="urgency-tape-group">{items}</span>
        <span className="urgency-tape-group">{items}</span>
      </span>
    </Link>
  );
}
