import HeroBanner from "@/components/HeroBanner";
import GuildShowcase from "@/components/GuildShowcase";

export default function DashboardHomePage() {
  return (
    <div>
      <HeroBanner />
      <div className="pt-16">
        <GuildShowcase />
      </div>
    </div>
  );
}
