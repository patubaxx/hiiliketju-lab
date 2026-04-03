import { ScenarioInputApp } from "@/features/scenario/input-ui/scenario-input-app";
import { LocaleProvider } from "@/i18n/locale-context";

export default function Home() {
  return (
    <LocaleProvider>
      <ScenarioInputApp />
    </LocaleProvider>
  );
}
