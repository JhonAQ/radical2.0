import Image from "next/image";
import "./FooterBeachScene.css";

const asset = "/assets/footer/";
const birdFlocks = [
  {
    className: "footer-beach-bird-flock--left",
    birds: [
      { src: "elem-flying-bird-single-1.webp", left: "0%", top: "30%", width: 48, rotate: -12 },
      { src: "elem-flying-bird-single-3.webp", left: "34%", top: "2%", width: 36, rotate: -24 },
      { src: "elem-flying-bird-single-2.webp", left: "56%", top: "52%", width: 35, rotate: 8 },
      { src: "elem-flying-bird-single-4.webp", left: "78%", top: "18%", width: 43, rotate: -5 },
    ],
  },
  {
    className: "footer-beach-bird-flock--center",
    birds: [
      { src: "elem-flying-bird-single-2.webp", left: "0%", top: "52%", width: 33, rotate: 10 },
      { src: "elem-flying-bird-single-1.webp", left: "23%", top: "14%", width: 50, rotate: -10 },
      { src: "elem-flying-bird-single-4.webp", left: "51%", top: "0%", width: 38, rotate: -23 },
      { src: "elem-flying-bird-single-3.webp", left: "69%", top: "45%", width: 36, rotate: 12 },
    ],
  },
  {
    className: "footer-beach-bird-flock--right",
    birds: [
      { src: "elem-flying-bird-single-4.webp", left: "0%", top: "40%", width: 37, rotate: -10 },
      { src: "elem-flying-bird-single-3.webp", left: "27%", top: "5%", width: 35, rotate: 8 },
      { src: "elem-flying-bird-single-1.webp", left: "54%", top: "25%", width: 48, rotate: -17 },
      { src: "elem-flying-bird-single-2.webp", left: "78%", top: "0%", width: 32, rotate: 18 },
    ],
  },
];

export function FooterBeachScene() {
  return (
    <div className="footer-beach-scene" aria-hidden="true">
      <Image src={`${asset}arena-footer.webp`} alt="" width={2172} height={244} sizes="100vw" className="footer-beach-sand" />

      {birdFlocks.map(({ className, birds }) => (
        <div key={className} className={`footer-beach-bird-flock ${className}`}>
          {birds.map(({ src, left, top, width, rotate }, index) => (
            <Image
              key={`${src}-${index}`}
              src={`/assets/elements/${src}`}
              alt=""
              width={170}
              height={81}
              sizes={`${width}px`}
              style={{ left, top, width, transform: `rotate(${rotate}deg)` }}
            />
          ))}
        </div>
      ))}

      <div className="footer-beach-left-group">
        <Image src={`${asset}follaje-lateral-izquierdo.webp`} alt="" width={933} height={1400} sizes="(min-width: 1440px) 190px, 130px" className="footer-beach-left-foliage" />
        <Image src={`${asset}arbustos-izquierda.webp`} alt="" width={1400} height={933} sizes="(min-width: 1440px) 410px, 290px" className="footer-beach-left-bush" />
        <Image src={`${asset}rocas-izquierda.webp`} alt="" width={1400} height={1050} sizes="(min-width: 1440px) 390px, 280px" className="footer-beach-left-rocks" />
      </div>

      <div className="footer-beach-right-group">
        <Image src="/assets/elements/elem-palm-tree-tall-curved.webp" alt="" width={346} height={544} sizes="(min-width: 1440px) 390px, 300px" className="footer-beach-right-palm" />
        <Image src={`${asset}arbustos-inferiores-derechos.webp`} alt="" width={1400} height={933} sizes="(min-width: 1440px) 410px, 290px" className="footer-beach-right-bush" />
        <Image src={`${asset}tabla-surf.webp`} alt="" width={933} height={1400} sizes="(min-width: 1440px) 170px, 120px" className="footer-beach-surfboard" />
        <Image src={`${asset}mochila-radical.webp`} alt="" width={1199} height={1312} sizes="(min-width: 1440px) 145px, 110px" className="footer-beach-backpack" />
        <Image src={`${asset}lampara-radical.webp`} alt="" width={933} height={1400} sizes="(min-width: 1440px) 72px, 55px" className="footer-beach-lantern" />
        <Image src={`${asset}rocas-extremo-derecho.webp`} alt="" width={1400} height={467} sizes="(min-width: 1440px) 480px, 330px" className="footer-beach-right-rocks" />
      </div>
    </div>
  );
}
