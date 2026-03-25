import { Link } from "react-router-dom";

import BrandLogo from "@/components/BrandLogo";

const Footer = () => (
  <footer className="bg-foreground py-12 text-background">
    <div className="container">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="mb-4 flex items-center gap-2">
            <BrandLogo iconClassName="h-8 w-8 rounded-lg" textClassName="text-lg text-background" />
          </Link>
          <p className="text-sm opacity-70">
            Conectamos conductores con espacio libre y personas que necesitan mover paquetes entre ciudades.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Plataforma</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li>
              <Link to="/search" className="transition-opacity hover:opacity-100">
                Buscar conductores
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="transition-opacity hover:opacity-100">
                Como funciona
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Cuenta</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li>
              <Link to="/register" className="transition-opacity hover:opacity-100">
                Registrarse
              </Link>
            </li>
            <li>
              <Link to="/login" className="transition-opacity hover:opacity-100">
                Iniciar sesion
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li>
              <a href="#" className="transition-opacity hover:opacity-100">
                Terminos de servicio
              </a>
            </li>
            <li>
              <a href="#" className="transition-opacity hover:opacity-100">
                Privacidad
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t border-background/10 pt-8 text-center text-sm opacity-50">
        Copyright {new Date().getFullYear()} Cargoo. Todos los derechos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
