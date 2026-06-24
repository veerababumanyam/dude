import { motion } from "motion/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Map as MapIcon } from "lucide-react";
import type { Proposal, StatusOption } from "../../types";
import { formatCurrency } from "../../utils";
import { useTranslation } from "../../i18n/context";

interface AnalyticsProps {
  proposals: Proposal[];
  statuses: StatusOption[];
  baseLat: number;
  baseLng: number;
}

export function Analytics({
  proposals,
  statuses,
  baseLat,
  baseLng,
}: AnalyticsProps) {
  const { t } = useTranslation();
  const data = statuses
    .map((opt) => {
      const subs = proposals.filter((s) => s.status === opt.value);
      return {
        name: t(`status.${opt.value}`),
        count: subs.length,
        value: subs.reduce((sum, s) => sum + (s.quotationValue || 0), 0),
        color: opt.color,
      };
    })
    .filter((d) => d.count > 0);

  if (data.length === 0) return null;

  const mapped = proposals.filter((s) => s.lat && s.lng);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, overflow: "hidden" }}
      animate={{ opacity: 1, height: "auto", overflow: "visible" }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      className="bg-white p-4 md:p-6 rounded-2xl border border-brand-500/10 shadow-sm flex flex-col md:flex-row items-stretch gap-6"
    >
      <div className="w-full md:w-1/3 flex flex-col">
        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">
          {t("dashboard.pipelineByStatus")}
        </h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value, name) => [
                  t("dashboard.proposalsCount", { n: Number(value) }),
                  name,
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow:
                    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="w-full md:w-1/3 flex flex-col border-t md:border-t-0 md:border-l border-neutral-100 pt-6 md:pt-0 md:pl-6">
        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">
          {t("dashboard.pipelineValue")}
        </h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 20, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f5f5f5"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#737373" }}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                tick={{ fontSize: 10, fill: "#737373" }}
              />
              <RechartsTooltip
                cursor={{ fill: "#f5f5f5" }}
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  t("dashboard.totalValue"),
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow:
                    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="w-full md:w-1/3 flex flex-col border-t md:border-t-0 md:border-l border-neutral-100 pt-6 md:pt-0 md:pl-6">
        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center">
          <MapIcon className="w-4 h-4 mr-2" /> {t("dashboard.siteMap")}
        </h3>
        <div className="flex-1 min-h-[200px] rounded-xl overflow-hidden border border-neutral-200 z-0 relative">
          <MapContainer
            center={[baseLat, baseLng]}
            zoom={10}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {mapped.map((s) => (
              <Marker key={s.id} position={[s.lat!, s.lng!]}>
                <Popup>
                  <div className="text-xs">
                    <strong>{s.siteName}</strong>
                    <br />
                    {t(`status.${s.status}`)}
                    <br />
                    {formatCurrency(s.quotationValue || 0)}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </motion.div>
  );
}
