import JitsLogoImage from "../assets/Jits_icon.png";

export function JitsLogo({ scale = 1 }: { scale?: number }) {
  return (
    <div
      className="relative w-fit"
      style={{ transform: `scale(${scale})` }}
    >
      {/* Jits Hero Logo Image */}
      <img 
        src={JitsLogoImage}
        alt="Jits Logo"
        className="w-100 max-w-3xl"
      />
    </div>
  );
}