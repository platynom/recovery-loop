# ONS Monthly Direct Debit Failures

## Provenance

- **Dataset:** Monthly Direct Debit failure rate and average transaction amount
- **Publisher:** Office for National Statistics; source data from Pay.UK and Vocalink
- **Source:** https://www.ons.gov.uk/economy/economicoutputandproductivity/output/datasets/monthlydirectdebitfailurerateandaveragetransactionamount
- **Downloaded:** 23 August 2026
- **Licence:** Open Government Licence v3.0
- **Extracted series:** non-seasonally-adjusted failure rate and non-seasonally-adjusted average transaction amount
- **Tidy file:** `data/external/ons-direct-debit-failures.csv`
- **Merged range:** January 2019 through July 2026, inclusive
- **Rows:** 637 observations plus the header (91 months × 7 sectors)

Every rate in the CSV is **non-seasonally adjusted**. It uses the 2025 edition for January 2019–December 2020 and the newer 2026 edition for January 2021–July 2026. This is necessary because the 2026 cover says the release covers January 2019 onward, while its total-series tables actually begin in January 2021. Where editions overlap, the most recent edition wins.

The CSV stores `failure_rate` as a decimal (for example, `0.01` means 1%) and `avg_transaction_amount` in pounds sterling.

## ONS definition

The latest workbook's Notes sheet states:

> “The failure rate is the number of Direct Debit failures due to insufficient funds divided by the total number of attemped Direct Debit transactions, per month.”

“Attemped” is reproduced from the ONS workbook. The 2023–2025 cover sheets use the same concept and spell out that the denominator is within the UK. Therefore this series measures **insufficient-funds failures only**, not every reason a Direct Debit can fail.

## Local workbook inventory

All four historical editions were already present in `C:\Users\Admin\Downloads`; no additional workbook download was needed.

| Edition | Filename | Bytes | Approx. MiB | Workbook data range |
|---|---|---:|---:|---|
| 2023 | `directdebittransactionsandfailuresdataset141223.xlsx` | 53,417 | 0.051 | Jan 2019–Nov 2023 |
| 2024 | `directdebittransactionsandfailuresdataset121224.xlsx` | 78,164 | 0.075 | Jan 2019–Nov 2024 |
| 2025 | `directdebittransactionsandfailuresdataset181225.xlsx` | 106,192 | 0.101 | Jan 2019–Nov 2025 |
| 2026 | `directdebittransactionsandfailuresdataset200826.xlsx` | 415,514 | 0.396 | Jan 2021–Jul 2026 in the tables; the cover claims Jan 2019–Jul 2026 |

## Workbook contents

Administrative sheets are listed even where they do not contain a rectangular time-series table.

### 2023 edition

| Sheet | Columns | Date range / contents |
|---|---|---|
| `Cover` | text | Metadata and definitions |
| `Contents` | Sheet name; Table description | Sheet index |
| `Direct debit failure rate` | Date; Total; Electricity and Gas; Fitness Facilities; Loans; Mortgages; Water | Jan 2019–Nov 2023 |
| `AVG Transaction amount Indexed` | Date; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water | Jan 2019–Nov 2023 |
| `Average transaction amount` | Date; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water | Jan 2019–Nov 2023 |

### 2024 edition

| Sheet | Columns | Date range / contents |
|---|---|---|
| `Cover` | text | Metadata and definitions |
| `Contents` | Sheet name; Table description | Sheet index |
| `Direct debit failure rate SA` | Date; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water | Jan 2019–Nov 2024 |
| `Direct debit failure rate NSA` | Date; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water | Jan 2019–Nov 2024 |
| `AVG Transaction amount Ind SA` | Date; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water | Jan 2019–Nov 2024 |
| `AVG Transaction amount Ind NSA` | Date; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water | Jan 2019–Nov 2024 |
| `AVG transaction amount NSA` | Date; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water | Jan 2019–Nov 2024 |

### 2025 edition

| Sheet | Columns | Date range / contents |
|---|---|---|
| `Cover` | text; blank layout column | Metadata and definitions |
| `Contents` | Sheet name; Table description | Sheet index |
| `Notes` | Note number; Note text; Applies to | Definitions and scope notes |
| `1.DD Failure Rates SA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2019–Nov 2025 |
| `2.DD Failure Rates NSA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2019–Nov 2025 |
| `3.Avg Trans Amount Index SA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2019–Nov 2025 |
| `4.Avg Trans Amount Index NSA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2019–Nov 2025 |
| `5.Avg Trans Amount Values NSA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2019–Nov 2025 |
| `6.Avg Trans Amount Values SA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2019–Nov 2025 |

### 2026 edition

| Sheet | Columns | Date range / contents |
|---|---|---|
| `Cover` | text; blank layout column | Metadata and definitions |
| `Contents` | Sheet name; Table description | Sheet index |
| `Notes` | Note number; Note text; Applies to | Definitions and scope notes |
| `1.DD Failure Rates Total SA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `2.DD Failure Rates Total NSA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `3.DD Failure Rates Salary NSA` | Month; Salary quintile; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `4.DD Failure Rates Benefit NSA` | Month; Benefit; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `5.Avg Trans Amt Ind Total SA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `6.Avg Trans Amt Ind Total NSA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `7.Avg Trans Amt Ind Salary NSA` | Month; Salary quintile; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `8.Avg Trans Amt Ind Benefit NSA` | Month; Benefit; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `9.Avg Trans Amt Val Total SA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `10.Avg Trans Amt Val Total NSA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `11.Avg Trans Amt Val Salary NSA` | Month; Salary quintile; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `12.Avg Trans Amt Val BenefitNSA` | Month; Benefit; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `13.DD Count Total NSA` | Month; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `14.DD Count Salary NSA` | Month; Salary quintile; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |
| `15.DD Count Benefit NSA` | Month; Benefit; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other | Jan 2021–Jul 2026 |

## Sector coverage

The expected sectors are confirmed: Total, Electricity and gas, Water, Mortgages, Loans, and Fitness facilities. Editions from 2025 onward also include `Other`, defined as payments outside the named categories, including credit-card bills, rent, council tax, and insurance. The 2026 edition additionally breaks results down by salary quintile and benefit receipt; the tidy CSV intentionally retains only the comparable total-series sectors.

## Revisions across overlapping editions

The editions do not agree exactly, so the extraction follows the requested “newest edition wins” rule. The 2026 edition is a substantial revision and changes the visible sample and methodology: its cover describes an aggregated, anonymised sample of consumer Direct Debits and its published total tables begin in 2021. Historical edition-difference figures were removed from the recording evidence because they are not used by the project and would require separate month-level provenance labels.

## August 2025 verification and project comparison

The **2026 edition**, non-seasonally-adjusted series reports **2.26% Total** and **5.74% Fitness facilities** for **August 2025**. For the same month, the older **2025 edition** reports **2.23185% non-seasonally adjusted** and **2.34799% seasonally adjusted**; the tidy extract follows the newer edition.

| Comparison | Rate | Relative to ONS Total | Relative to Fitness facilities | Assessment |
|---|---:|---:|---:|---|
| ONS Total, Aug 2025 (2026 edition, non-seasonally adjusted) | 2.26% | 1.0× | 0.39× | UK Bacs Direct Debit; insufficient-funds failures only |
| ONS Fitness facilities, Aug 2025 (2026 edition, non-seasonally adjusted) | 5.74% | 2.54× | 1.0× | Closest public subscription proxy in this dataset |
| Recovery Loop simulated cohort | 100% initially failed by construction | 44.25× | 17.42× | **Not a portfolio failure-rate assumption.** The evaluator samples already-failed mandates, so this denominator is intentionally conditional and cannot be compared as prevalence. |

The simulator therefore has **no assumed portfolio-wide recurring-payment failure rate** to validate against ONS. Its 42% number is the share of insufficient-funds cases *within the legacy simulated failure mix*, not a transaction failure rate. The already-failed cohort design is defensible for comparing retry policies conditional on failure, but it is not defensible as an estimate of merchant-wide payment failure prevalence.

ONS is UK Bacs Direct Debit, not UPI AutoPay or cards. It is retained only as a real, different-rail order-of-magnitude sanity check; no simulator input, policy parameter, threshold, evaluation artifact, or headline result was changed to match it.

## Reason-mix benchmark

The Minneapolis Fed study begins from 1.2 billion 2006 FedACH consumer-debit transactions; its return-reason table uses 21.6 million returns matched to forwards. The paper states: “Insufficient funds account for about 70 percent of all returned items in our matched data, and this percentage does not vary much with return rates.” The legacy simulator uses 42% insufficient funds, a gap of **28 percentage points**; 42% is **40% lower** than the study benchmark on a relative basis. This is recorded as a limitation, not used to retune the frozen evaluation.

## Salary and benefit breakdowns

The 2026 workbook adds four non-seasonally-adjusted salary-quintile tables and four non-seasonally-adjusted benefit-recipient tables, all covering January 2021–July 2026.

| Population | Sheets | Columns |
|---|---|---|
| Salary quintile | `3.DD Failure Rates Salary NSA`; `7.Avg Trans Amt Ind Salary NSA`; `11.Avg Trans Amt Val Salary NSA`; `14.DD Count Salary NSA` | Month; Salary quintile; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other |
| Benefit recipient | `4.DD Failure Rates Benefit NSA`; `8.Avg Trans Amt Ind Benefit NSA`; `12.Avg Trans Amt Val BenefitNSA`; `15.DD Count Benefit NSA` | Month; Benefit; Total; Electricity and gas; Fitness facilities; Loans; Mortgages; Water; Other |

The salary tables contain `Quintile 1` through `Quintile 5`. ONS defines the population as: “Salary quintiles are based on an aggregated and anonymised sample of accounts which receive Bacs Direct Credit payments with the accounting Real Time Information Hash reference in the specified month.” The Notes sheet adds: “Salary quintiles are based on salary payments made in the given month.”

These tables can show monthly Direct Debit failure rates varying across salary-income quintiles. They **cannot show proximity to payday**: there is no payment date, salary-credit date, or days-since-pay field. They therefore do not validate the simulator's payday-proximity recovery rule and are not added to the README benchmark tier.
