// Generado por scripts/generate-blur-placeholders.mjs. No editar a mano.
const placeholders: Record<string, string> = {
  "/assets/activities/beach-evening.jpg": "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAAAQAgCdASoJABAAA4BaJZQCdH8AGBGJKAaAAP7zN6jBpSfQDncJ17l+vpNJ3fF7zViB+C8bc+StjQTeN5o1gAAA",
  "/assets/activities/beach.jpg": "data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADQAQCdASoQAAkAA4BaJZwC7AEO//y1kAD+6eMeLjdAtos1dvrAh2VQAlOZFl6MV8TupGaPLh/8naF4AAA=",
  "/assets/activities/community.jpg": "data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAACwAQCdASoJABAAA4BaJagAAuaWEQkAAP75DlMUYOELUfuUoktdAWGd3DMMjKsMVsK2QvcFo4lgfITrPUPZ2pUf+Me7Gv7xwAA=",
  "/assets/activities/games.jpg": "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAACwAQCdASoJABAAA4BaJZwAAuqpjdwAAP7Xk5cw6Y4S/tH4v4LB6lnppuPYhu4G1RweYQ+yOK1iT0kcSPqzaLiqWfdZS+2AFkAAAA==",
  "/assets/activities/group-games.jpg": "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAACwAQCdASoJABAAA4BaJZwAAuqpjdwAAP7Xk5cw6Y4S/tH4v4LB6lnppuPYhu4G1RweYQ+yOK1iT0kcSPqzaLiqWfdZS+2AFkAAAA==",
  "/assets/activities/live-worship.jpg": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADQAQCdASoJABAAA4BaJZwAL4AMrnFUAAD+3blOR1IyvGZz8e+h0PcXtuWrCHyVaSfzj5ADvRlDOiu17BNW3uDvY24uXyI/HV7g0z7MAQAAAA==",
  "/assets/activities/night-community.jpg": "data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAACwAQCdASoJABAAA4BaJZQAAubL5imgAP75D9xG3qeamgxVzAT/t1zznB7Pa9TBW1rqWaIsGvaF+TcweAA=",
  "/assets/activities/workshop-activity.jpg": "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAAAwAgCdASoJABAAA4BaJYwC7AEegmhr4ca1gAD+1iY4Plva/ErX8XO4lbbkvbxv+9eakuEm2gJGkq03j00Z1xyrS+1rnUirq7XGCSrRGg8rWlIAAAA=",
  "/assets/activities/workshop.jpg": "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAACwAQCdASoQAAkAA4BaJZQC7ACD+j2AAP4HVJPqkExUoV68neQ8hq+QF+5VbsX4bRhgaNVtNh4Q5C7PfvDH8sCij233VnY0RzwxfOvOssCyIYAA",
  "/assets/activities/worship.jpg": "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAADwAQCdASoQAAkAA4BaJbACdIExCn0cWAAA/uzHV3d1geYU5FPD/yn/HVXw0DzkxNDYThQw9R0XNNk+6kItPPyTQpcd11NVmbrgUZQAiPVyFx2M3sAD/4EdoAA=",
  "/assets/location/campel-entrada.webp": "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAAAQAgCdASoMABAAA4BaJYgCdAD0rhfNAOyAAP7gxLUG2+ko/8w9t7hxeWn/RApnAH9NaSsATNxA+EVYNVV7udFM7aWCoa07i0k63RBReKn+HYY4YAA=",
  "/assets/location/campel-noche.webp": "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAACwAQCdASoQAAwAA4BaJZQAAucWPGgAAP72kZl+n9eHuo/6d8+aEhoGbTPqmDsknxZgrLJJIfpTI/+pknGhQDdPgAA=",
};

/** Props de next/image para mostrar una versión borrosa mientras carga la foto. */
export function blurProps(src: string) {
  const blurDataURL = placeholders[src];
  return blurDataURL ? ({ placeholder: "blur", blurDataURL } as const) : {};
}
