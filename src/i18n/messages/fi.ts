import type { MessageTree } from "./tree";

export const fi = {
  app: {
    title: "Hiiliketju",
    tagline: "Teknis-taloudellinen skenaario­syöte (MVP)",
  },
  locale: {
    label: "Kieli",
    en: "Englanti",
    fi: "Suomi",
    sv: "Ruotsi",
  },
  scenarioForm: {
    title: "Skenaario",
    description:
      "Määritä syötteet yhdelle 365 päivän analyysijaksolle (ei karkausvuotta). Validointi ja laskenta käyttävät samaa sopimusta kuin moottori.",
    periodNote: "Analyysijakso on MVP:ssä kiinteästi 365 päivää.",
    scenarioName: "Skenaarion nimi",
    assumptionsVersion: "Oletusten versio",
    assumptionsNotes: "Skenaarion muistiinpanot (valinnainen)",
    runCalculation: "Suorita laskenta",
    reset: "Palauta oletukset",
    generalValidation: "Korjaa alla olevat kohdat.",
  },
  sections: {
    co2: "Hiilidioksidin saatavuus",
    co2Intro:
      "Vuosittainen saatavuus, hyötysuhde ja CO₂:n jakautuminen vuoden aikana. Aikasarjamodeissa päivittäinen saatavuus tulee antamastasi sarjasta; kt/v-kenttä on lomakkeella edelleen pakollinen, mutta nykyinen moottori ei skaalaa sarjaa sen mukaan.",
    electricity: "Sähkön hinta",
    electricityIntro:
      "Miten sähkön hinta annetaan MVP-horisontilla. Tuntidata harmonisoidaan päivittäisiksi keskiarvoiksi.",
    economics: "Taloudelliset tiedot",
    economicsIntro: "Hyödykkeiden hinnat, käyttökulut ja valinnainen investointi.",
    advanced: "Edistyneet prosessioletukset",
    advancedIntro:
      "Korvaa kirjallisuusoletukset vain kun sinulla on kohteeseen sidottuja tietoja. Metatieto tallentuu jokaisen arvon mukana jäljitettävyyttä varten.",
    results: "Laskentatulos",
  },
  co2: {
    annualKt: "Vuotuinen CO₂ (kt/v)",
    utilization: "Hyötysuhde (%)",
    mode: "Ajallinen profiili",
    mode_flat_annual: "Tasainen (jakautuu tasaisesti vuoteen)",
    mode_seasonal_daily: "Vuodenaikainen (kuukausipainot)",
    mode_time_series_daily: "Aikasarja (päivittäinen kg/päivä, 365 arvoa)",
    mode_time_series_hourly: "Aikasarja (tuntikohtainen kg/h, 8760 arvoa)",
    seasonalHelp:
      "Kaksitoista suhteellista painotusta (kalenterikuukausittain). Nollat sallittuja; vähintään yhden kuukauden on oltava suurempi kuin nolla. Moottori skaalaa painot vuosimäärään.",
    month: "Kuukausi",
    seriesDailyLabel: "Päivittäinen saatava CO₂ (kg/päivä × 365)",
    seriesDailyHelp:
      "Syötä tasan 365 ei-negatiivista lukua pilkuilla, puolipisteillä tai rivinvaihdoilla eroteltuna.",
    seriesHourlyLabel: "Tuntikohtainen saatava CO₂ (kg/h × 8760)",
    seriesHourlyHelp:
      "Syötä tasan 8760 ei-negatiivista lukua. Tunnit summataan kalenteripäiviksi moottorissa.",
    timeSeriesAnnualHint:
      "Aikasarjamodeissa moottori käyttää vain sarjaa saatavuuteen; pidä kt/v linjassa omien raporttiesi kanssa, jos käytät sitä.",
    fillOnes365: "Täytä 365 × 1",
    fillOnes8760: "Täytä 8760 × 1",
  },
  electricity: {
    mode: "Hintatapa",
    mode_constant: "Vakio (EUR/MWh)",
    mode_daily_series: "Päiväsarja (365 EUR/MWh-arvoa)",
    mode_hourly_series: "Tuntisarja (8760 EUR/MWh-arvoa)",
    mode_historical_imported: "Tuodut markkinatiedot (päivä- tai tuntisarja)",
    constantPrice: "Sähkön hinta (EUR/MWh)",
    seriesDailyLabel: "Päivähinnat (EUR/MWh × 365)",
    seriesHourlyLabel: "Tuntihinnat (EUR/MWh × 8760)",
    seriesHelp:
      "Syötä vaadittu määrä ei-negatiivisia lukuja pilkuilla, puolipisteillä tai rivinvaihdoilla eroteltuna.",
    historicalResolution: "Tuodun sarjan resoluutio",
    resolution_daily: "Päivittäinen (365 arvoa)",
    resolution_hourly: "Tuntikohtainen (8760 arvoa)",
    historicalHelp:
      "Liitä normalisoidut EUR/MWh-arvot MVP-järjestyksessä. Tiedoston tuonti ja puhdistus eivät kuulu tähän näkymään.",
    fillOnes365: "Täytä 365 × 50",
    fillOnes8760: "Täytä 8760 × 50",
  },
  economics: {
    methanePrice: "Metaanin hinta (EUR/t CH₄)",
    hydrogenPrice: "Vedyn hinta (EUR/kg H₂)",
    otherOpex: "Muut käyttökulut (EUR/v)",
    includeCapex: "Laske investointi mukaan kustannuksiin",
    electrolyzerCapex: "Elektrolyyserin CAPEX (EUR)",
    methanationCapex: "Metaanoinnin CAPEX (EUR)",
    capexLifetime: "Investoinnin elinikä (vuotta)",
  },
  advanced: {
    inactiveFactorsTitle: "Ei vielä päivittäisissä kaavoissa",
    inactiveFactorsBody:
      "Laitoksen käytettävyys ja prosessin hyötysuhde kulkevat metatietoineen läpinäkyvyyden vuoksi, mutta nykyinen MVP-päivämoottori ei kerro näillä arvoilla (oletukset ovat neutraalit 100 %).",
    override: "Korvaa oletus",
    value: "Arvo",
    assumptionSource: "Oletuksen lähde",
    assumptionStatus: "Oletuksen tila",
    assumptionNote: "Huomautus (valinnainen)",
    field_stoichH2: "Stoikiometrinen H₂-tarve (kg H₂ / kg CO₂)",
    field_stoichCh4: "Stoikiometrinen CH₄-saanto (kg CH₄ / kg CO₂)",
    field_secKwh: "Elektrolyyserin SEC (kWh / kg H₂)",
    field_secMwh: "Elektrolyyserin SEC (MWh / kg H₂)",
    field_plantAvail: "Laitoksen käytettävyys (%)",
    field_processEff: "Prosessin hyötysuhde (%)",
  },
  assumptionSource: {
    customer_provided: "Asiakkaan toimittama",
    product_locked: "Tuotteessa lukittu",
    literature_based: "Kirjallisuuteen perustuva",
    placeholder: "Paikkamerkki",
    derived: "Johdettu",
  },
  assumptionStatus: {
    confirmed: "Vahvistettu",
    estimated: "Arvio",
    pending_customer_confirmation: "Odottaa asiakkaan vahvistusta",
    placeholder_only: "Vain paikkamerkki",
  },
  validation: {
    seriesWrongCount: "Odotettiin {{expected}} lukua, jäsennettiin {{actual}}.",
    seriesNonNumeric: "Kaikkia kohtia ei voitu tulkita äärellisiksi luvuiksi.",
    invalidNumber: "Anna kelvollinen äärellinen luku.",
    fieldRequired: "Tämä kenttä on pakollinen.",
  },
  results: {
    title: "Viimeisin tulos",
    empty: "Suorita laskenta nähdäksesi moottorin kanoniset tulosteet.",
    success: "Laskenta valmistui onnistuneesti.",
    warningsTitle: "Varoitukset",
    annualMethaneT: "Vuosimetaani (t CH₄)",
    annualTotalCost: "Vuosikokonaiskustannus (EUR)",
    annualCo2Utilized: "Käytetty CO₂ vuodessa (kg)",
    annualElectricityMwh: "Sähkönkulutus vuodessa (MWh)",
    deltaHydrogenPath: "Metaanituotto miinus H₂-vaihtoehto (EUR)",
  },
} satisfies MessageTree;
