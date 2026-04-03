### Git process

This document is a reminder for human user. Agents can ignore.

Ennen GitHubiin puskemista tekisin nämä ihan tässä järjestyksessä:

```bash
git status
npm test
git add test patches/agent3-testing-foundation.patch
git commit -m "test: add agent 3 testing foundation and golden scenarios"
git push
```

Jos et halua patch-tiedostoa mukaan repositorioon, jätä se pois `git add` -komennosta:

```bash
git add test
git commit -m "test: add agent 3 testing foundation and golden scenarios"
git push
```

Minun suositukseni on:

* **commitoi testit varmasti**
* **patch-tiedoston commitoiminen on valinnainen**
* jos `patches/`-kansio toimii teillä audit trailina, sen voi hyvin pitää mukana
* jos haluatte pitää repoa siistimpänä, jätä patch pois

Tässä sinulle yksinkertainen, selkeä ja käytännön Git-prosessi Cursor-agenttien käyttöön.

## Suositeltu Git-prosessi Cursor-agenttien kanssa

### 1. Luo yksi työ per branch

Kun aloitat uuden agenttityön, tee oma branch:

```bash
git checkout -b agent3/testing-foundation
```

Ajatus:

* yksi agentti tai yksi selkeä työpaketti = yksi branch

### 2. Anna Cursorin tehdä työ vain siinä branchissa

Cursor tekee muutokset, mutta älä commitoi heti.
Pyydä siltä aina lopuksi:

* raportti
* diffi tai patch
* lista muuttuneista tiedostoista

### 3. Tarkista itse nämä kolme asiaa

Aina ennen commitia:

```bash
git status
git diff --stat
npm test
```

Katso:

* mitä tiedostoja muuttui
* ovatko muutokset suunnitelluissa paikoissa
* menevätkö testit läpi

### 4. Validoi muutos ennen commitia

Tuo raportti ja diffi tänne, jos haluat varmistuksen.
Hyvä tarkistuslista:

* muuttiko agentti vain scopessa sovittuja tiedostoja
* onko ratkaisu linjassa arkkitehtuurin kanssa
* onko testit / build vihreänä

### 5. Stage vain ne tiedostot, jotka oikeasti kuuluvat työhön

Älä käytä automaattisesti `git add .`

Parempi:

```bash
git add test
```

tai tarkemmin:

```bash
git add test/calculation-engine.test.ts test/scenario-schemas.test.ts
```

Näin vahingossa mukaan ei mene turhia tiedostoja.

### 6. Commit selkeällä viestillä

Hyvä formaatti:

```bash
git commit -m "test: add agent 3 testing foundation and golden scenarios"
```

Esimerkkejä:

* `feat: add scenario input form`
* `refactor: simplify capex allocation helpers`
* `test: expand calculation regression coverage`

### 7. Push branchiin, ei suoraan päähaaraan

```bash
git push -u origin agent3/testing-foundation
```

Tämän jälkeen voit tehdä PR:n tai mergätä omalla tavallasi.

### 8. Merge vasta hyväksynnän jälkeen

Vasta kun:

* diffi on tarkistettu
* testit menevät läpi
* työ on hyväksytty

sitten merge päähaaraan.

---

## Yksinkertainen käytännön sääntö jokaiseen agenttityöhön

Aina tämä järjestys:

1. uusi branch
2. Cursor tekee työn
3. `git status`
4. `npm test`
5. diffin validointi
6. `git add` vain oikeille tiedostoille
7. commit
8. push
9. merge vasta hyväksynnän jälkeen

---

## Mitä teet nyt käytännössä

Koska Agentti 3:n työ näyttää hyväksyttävältä, tee nyt tämä:

```bash
git status
npm test
git add test
git commit -m "test: add agent 3 testing foundation and golden scenarios"
git push
```

Jos haluat säilyttää myös patchin repossa:

```bash
git add test patches/agent3-testing-foundation.patch
git commit -m "test: add agent 3 testing foundation and golden scenarios"
git push
```


