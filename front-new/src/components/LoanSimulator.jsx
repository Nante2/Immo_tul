import { useState, useId } from "react";
import { Calculator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const DURATIONS = [5, 10, 15, 20, 25];

const formatAr = (value) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(value)).replace(/ | /g, " ")} Ar`;

// Mensualité d'un prêt à taux fixe : M = C × t / (1 − (1 + t)^−n)
const monthlyPayment = (capital, annualRate, years) => {
  const n = years * 12;
  const t = annualRate / 100 / 12;
  if (capital <= 0 || n <= 0) return 0;
  if (t === 0) return capital / n;
  return (capital * t) / (1 - (1 + t) ** -n);
};

// Simulateur indicatif de crédit pour les biens à vendre
const LoanSimulator = ({ price }) => {
  const id = useId();
  const [downPct, setDownPct] = useState(30);
  const [rate, setRate] = useState(14);
  const [years, setYears] = useState(15);

  const downPayment = (price * downPct) / 100;
  const capital = price - downPayment;
  const monthly = monthlyPayment(capital, Number(rate) || 0, years);
  const totalCost = monthly * years * 12 - capital;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8">
        <h2 className="flex items-center gap-2 text-xl font-bold mb-1">
          <Calculator className="w-5 h-5 text-primary" />
          Simulateur de crédit
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Estimation indicative. Les conditions réelles dépendent de votre banque.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <label htmlFor={`${id}-down`} className="font-medium">Apport personnel</label>
                <span className="text-muted-foreground">{downPct} % · {formatAr(downPayment)}</span>
              </div>
              <input
                id={`${id}-down`}
                type="range"
                min="0"
                max="90"
                step="5"
                value={downPct}
                onChange={(e) => setDownPct(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${id}-rate`} className="block text-sm font-medium mb-2">Taux annuel (%)</label>
                <input
                  id={`${id}-rate`}
                  type="number"
                  min="0"
                  max="40"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label htmlFor={`${id}-years`} className="block text-sm font-medium mb-2">Durée</label>
                <select
                  id={`${id}-years`}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {DURATIONS.map((d) => <option key={d} value={d}>{d} ans</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 p-6 flex flex-col justify-center" aria-live="polite">
            <p className="text-sm text-muted-foreground">Mensualité estimée</p>
            <p className="text-3xl font-bold text-primary my-1">{formatAr(monthly)}</p>
            <p className="text-sm text-muted-foreground">pendant {years} ans</p>
            <dl className="mt-5 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Montant emprunté</dt>
                <dd className="font-medium">{formatAr(capital)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Coût total des intérêts</dt>
                <dd className="font-medium">{formatAr(Math.max(totalCost, 0))}</dd>
              </div>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoanSimulator;
