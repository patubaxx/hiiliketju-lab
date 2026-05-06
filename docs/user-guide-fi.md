# Hiiliketju — käyttöopas (suomi)

Yleistajuinen kuvaus työkalusta päätöksenteon ja keskustelun tueksi.

---

## Mikä tämä työkalu on?

Hiiliketju on laskentatyökalu, joka auttaa arvioimaan, **kannattaako hiilidioksidista ja vedystä valmistaa synteettistä metaania** vai olisiko järkevämpää käyttää vety johonkin muuhun tai myydä se sellaisenaan.

Se näyttää nopeasti, paljonko tuotanto voisi maksaa, paljonko metaania syntyy ja millä hinnalla toiminta voisi olla kannattavaa.

---

## Mitä tämä tekee käytännössä?

Työkalu vertaa kahta vaihtoehtoa:

### Vaihtoehto A: Hiilidioksidista metaania

Yrityksen talteen ottama CO₂ yhdistetään vetyyn ja valmistetaan metaania (synteettinen kaasu).

### Vaihtoehto B: Vety myydään sellaisenaan

Hiilidioksidia ei hyödynnetä tässä prosessissa, vaan vety myydään markkinoille.

Työkalu kertoo, kumpi vaihtoehto näyttää taloudellisesti paremmalta valituilla oletuksilla.

---

## Mitä käyttäjän pitää syöttää?

Peruskäytössä vain muutama tieto riittää:

### 1. Kuinka paljon hiilidioksidia syntyy?

Esimerkiksi:

- 10 000 tonnia vuodessa
- 50 000 tonnia vuodessa

### 2. Mikä on sähkön hinta?

Koska vedyn valmistus kuluttaa paljon sähköä.

Esimerkiksi:

- 40 €/MWh
- 60 €/MWh

### 3. (Valinnaiset tiedot)

Jos halutaan tarkempi analyysi:

- metaanin myyntihinta
- vedyn myyntihinta
- investointikustannukset
- sähkön hintavaihtelu vuoden aikana
- CO₂:n kausivaihtelu
- mahdolliset laitoskapasiteetin päivittäiset rajat
- mahdollinen CO₂:n markkinaosto, jos sivuvirta ei riitä määritettyyn kapasiteettiin

---

## Miten työkalu laskee tulokset?

Yksinkertaistettuna näin:

### Vaihe 1: CO₂ määrä

Työkalu ottaa käyttäjän ilmoittaman hiilidioksidimäärän.

### Vaihe 2: Laskee tarvittavan vedyn

Kemiallisen reaktion perusteella lasketaan, paljonko vetyä tarvitaan.

### Vaihe 3: Laskee sähkönkulutuksen

Koska vety tehdään sähköllä, lasketaan paljonko sähköä tarvitaan.

### Vaihe 4: Laskee kustannukset

Mukana voi olla:

- sähkökustannus
- muut käyttökulut
- investointikulut
- mahdollinen ostetun CO₂:n kustannus

### Vaihe 5: Laskee tuotannon ja kannattavuuden

Tuloksena saadaan esimerkiksi:

- paljonko metaania syntyy vuodessa
- paljonko se maksaa tuottaa
- mikä olisi kannattava myyntihinta
- onko metaani parempi vaihtoehto kuin vedyn myynti
- paljonko CO₂:sta tuli omasta sivuvirrasta ja paljonko mahdollisesti ostettiin markkinalta

Ostettu CO₂ pidetään tuloksissa erillään yrityksen omasta sivuvirran CO₂:sta. Sivuvirran hyödyntämisaste kuvaa vain sitä, kuinka suuri osa saatavilla olevasta sivuvirrasta käytettiin prosessissa.

---

## Miten tuloksia tulkitaan?

### Jos tuotantokustannus on matala

→ Prosessi voi olla kilpailukykyinen.

### Jos kannattava myyntihinta on korkea

→ Tarvitaan premium-markkina, tuki tai erityisasiakas.

### Jos vedyn myynti näyttää paremmalta

→ Vedyn myynti voi olla järkevämpi kuin metaanin valmistus.

### Jos sähkö on kallista

→ Kannattavuus heikkenee nopeasti.

---

## Mitä hyötyä tästä työkalusta on?

### Nopea päätöksenteon tuki

Näkee nopeasti, onko idea realistinen.

### Investointien arviointi

Kannattaako selvittää hanketta tarkemmin?

### Skenaariovertailu

Mitä tapahtuu jos:

- sähkö halpenee?
- CO₂ määrä kasvaa?
- metaanin hinta nousee?

### Keskustelutyökalu

Hyvä yrityksille, kunnille, energiayhtiöille ja hankekehitykseen.

---

## Yhden lauseen hissipuhe

Hiiliketju näyttää nopeasti, voiko hiilidioksidista ja vedystä valmistettu synteettinen metaani olla taloudellisesti järkevää juuri sinun lähtötiedoillasi.

---

## Jos joku kysyy “miksi tämä on tärkeä?”

Koska tulevaisuudessa päästöjä ei riitä vain vähentää — myös hiilidioksidille pitää löytää hyödyllisiä käyttötapoja. Tämä työkalu auttaa arvioimaan, missä tilanteessa se voi kannattaa.

---

## Päivitys (huhtikuu 2026)

Käyttöliittymän oletuskieli on **suomi**, jos käyttäjä ei ole valinnut toista kieltä. Sivun yläosan aloitusalueella voi näkyä **Business Finlandin** ja **LAB-ammattikorkeakoulun** tunnukset, kun vastaavat tiedostot on lisätty palvelimen `public/`-kansioon (ks. tekninen dokumentaatio). Tulosnäkymässä on lyhyt **taloudellinen tulkinta** ja **laskennassa käytetyt oletukset** — ne eivät ole sijoitussuosituksia.

---

## Rehellinen huomio

Tämä ei ole tehdassuunnitelma eikä lopullinen investointipäätösraportti.

Tämä on **ensivaiheen analyysityökalu**, jolla tunnistetaan lupaavat vaihtoehdot nopeasti.
