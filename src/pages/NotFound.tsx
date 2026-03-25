import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="soft-panel max-w-xl p-8 text-center md:p-12">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">404</p>
        <h1 className="mt-4 font-heading text-4xl font-bold md:text-5xl">Esta ruta no existe en Cargoo</h1>
        <p className="mt-4 text-muted-foreground">
          La pagina que intentaste abrir no esta disponible. Puedes volver al inicio o abrir la busqueda de transportistas.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/home">Ir al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/marketplace">Buscar transportistas</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
