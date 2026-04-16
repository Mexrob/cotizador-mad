export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Página no encontrada
        </h2>
        <p className="text-muted-foreground mb-6">
          La página que buscas no existe o fue movida.
        </p>
        <a
          href="/"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-block"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  )
}
