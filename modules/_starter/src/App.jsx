import { Button, Card } from "@savitri/ui-kit";

export default function App() {
  return <main className="starter-shell">
    <p className="starter-kicker">SAVITRI LIVINGS · MODULE STARTER</p>
    <Card>
      <h1>Your product starts here</h1>
      <p>Build an accessible, focused experience. Configure its route and visibility through Savitri Admin.</p>
      <Button type="button" onClick={() => window.location.assign("https://home-decor-inky.vercel.app/tools")}>Explore Savitri tools</Button>
    </Card>
  </main>;
}
