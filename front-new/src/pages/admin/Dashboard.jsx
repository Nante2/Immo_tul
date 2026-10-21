import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../services/api';
import { Eye, MessageSquare, Home, Clock, TrendingUp, Plus, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from "../../hooks/usePageTitle";

const formatDay = (iso, options = { day: '2-digit', month: 'short' }) =>
  new Intl.DateTimeFormat('fr-FR', options).format(new Date(`${iso}T00:00:00`));

// Arrondit le maximum de l'axe à une valeur « propre » et paire (2, 4, 10, 20, 40, 100…)
// pour que la graduation du milieu reste un nombre entier
const niceMax = (value) => {
  if (value <= 2) return 2;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 4, 10].find((s) => s * magnitude >= value);
  return Math.max(step * magnitude, 2);
};

// Histogramme quotidien (une seule série) avec info-bulle au survol et vue tableau
const DailyColumnChart = ({ title, data, valueKey, color, unit }) => {
  const [hovered, setHovered] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const total = data.reduce((sum, d) => sum + d[valueKey], 0);
  const max = niceMax(Math.max(...data.map((d) => d[valueKey]), 0));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500">
            {total} {unit} sur les 30 derniers jours
          </p>
        </div>
        <button
          onClick={() => setShowTable((v) => !v)}
          className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
        >
          {showTable ? 'Voir le graphique' : 'Voir le tableau'}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-56 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 font-medium text-right">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date} className="border-b last:border-0">
                  <td className="py-1 text-slate-600">{formatDay(d.date, { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                  <td className="py-1 text-right font-medium text-slate-800 tabular-nums">{d[valueKey]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Axe Y */}
          <div className="flex flex-col justify-between h-44 text-[11px] text-slate-400 tabular-nums text-right w-6 -mt-1.5">
            <span>{max}</span>
            <span>{max / 2}</span>
            <span>0</span>
          </div>
          <div className="flex-1">
            <div className="relative h-44">
              {/* Lignes de repère */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-100" />
                <div className="border-t border-slate-100" />
                <div className="border-t border-slate-200" />
              </div>
              {/* Colonnes */}
              <div className="absolute inset-0 flex items-end gap-[2px]">
                {data.map((d, i) => {
                  const value = d[valueKey];
                  return (
                    <div
                      key={d.date}
                      className="relative flex-1 h-full flex items-end justify-center cursor-default"
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      aria-label={`${formatDay(d.date)} : ${value} ${unit}`}
                    >
                      <div
                        className="w-full max-w-[24px] rounded-t-[4px] transition-opacity"
                        style={{
                          height: value > 0 ? `${Math.max((value / max) * 100, 2)}%` : 0,
                          backgroundColor: color,
                          opacity: hovered === null || hovered === i ? 1 : 0.45,
                        }}
                      />
                      {hovered === i && (
                        <div
                          className={`absolute bottom-full mb-1 z-10 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white shadow ${
                            i < 4 ? 'left-0' : i > data.length - 5 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                          }`}
                        >
                          <span className="text-slate-300">{formatDay(d.date, { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                          <span className="ml-2 font-semibold">{value} {unit}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Axe X */}
            {data.length > 0 && (
              <div className="flex justify-between mt-2 text-[11px] text-slate-400">
                <span>{formatDay(data[0].date)}</span>
                <span>{formatDay(data[Math.floor(data.length / 2)].date)}</span>
                <span>{formatDay(data[data.length - 1].date)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  usePageTitle("Admin · Tableau de bord");
  const { user } = useAuth();
  const [greeting] = useState(() => (new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'));
  const [stats, setStats] = useState({ views: 0, inquiries: 0, properties: 0, newContacts: 0 });
  const [recent, setRecent] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [topProperties, setTopProperties] = useState([]);

  useEffect(() => {
    getAdminStats()
      .then((data) => {
        if (data.overview) {
          setStats({
            views: data.overview.totalViews || 0,
            inquiries: data.overview.totalContacts || 0,
            properties: data.overview.totalProperties || 0,
            newContacts: data.overview.newContacts || 0,
          });
        }
        setRecent(data.recentProperties || []);
        setTimeline(data.timeline || []);
        setTopProperties(data.topProperties || []);
      })
      .catch((err) => console.error('Error fetching stats:', err));
  }, []);

  const statCards = [
    { title: 'Vues totales', value: stats.views, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Messages reçus', value: stats.inquiries, icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-100', badge: stats.newContacts > 0 ? `${stats.newContacts} nouv.` : null, link: '/admin/messages' },
    { title: 'Propriétés', value: stats.properties, icon: Home, color: 'text-purple-600', bg: 'bg-purple-100', link: '/admin/properties' },
  ];


  return (
    <div className="space-y-8">
      {/* Accueil + actions rapides */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{greeting}, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-sm text-slate-500">
            {stats.newContacts > 0
              ? `Vous avez ${stats.newContacts} nouveau${stats.newContacts > 1 ? 'x' : ''} message${stats.newContacts > 1 ? 's' : ''} à traiter.`
              : 'Aucun nouveau message à traiter.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {stats.newContacts > 0 && (
            <Link to="/admin/messages" className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Mail size={16} /> Voir les messages
            </Link>
          )}
          <Link to="/admin/properties?nouveau=1" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus size={16} /> Ajouter un bien
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <>
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${stat.bg}`}>
                  <Icon size={24} className={stat.color} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                </div>
              </div>
              {stat.badge && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {stat.badge}
                </span>
              )}
            </>
          );
          const className = 'bg-white rounded-lg p-6 shadow-sm border flex items-center justify-between';
          return stat.link ? (
            <Link key={stat.title} to={stat.link} className={`${className} hover:border-slate-300 transition-colors`}>
              {content}
            </Link>
          ) : (
            <div key={stat.title} className={className}>{content}</div>
          );
        })}
      </div>

      {timeline.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DailyColumnChart title="Vues des biens" data={timeline} valueKey="views" color="#2563eb" unit="vues" />
          <DailyColumnChart title="Messages reçus" data={timeline} valueKey="inquiries" color="#16a34a" unit="messages" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-slate-500" />
            Biens les plus consultés
          </h3>
          {topProperties.length === 0 ? (
            <p className="text-slate-500">Pas encore de consultations.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 font-medium">Bien</th>
                  <th className="py-2 font-medium text-right">Vues</th>
                  <th className="py-2 font-medium text-right">Demandes</th>
                </tr>
              </thead>
              <tbody>
                {topProperties.map((prop) => (
                  <tr key={prop.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link to={`/property/${prop.id}`} target="_blank" className="font-medium text-slate-800 hover:text-blue-600">
                        {prop.titre}
                      </Link>
                      <p className="text-xs text-slate-500">{prop.type} • {prop.actionType === 'sale' ? 'À vendre' : 'À louer'}</p>
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-800 tabular-nums">{prop.views}</td>
                    <td className="py-3 text-right text-slate-600 tabular-nums">{prop.inquiries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-slate-500" />
            Dernières propriétés ajoutées
          </h3>
          {recent.length === 0 ? (
            <p className="text-slate-500">Aucune activité récente pour le moment.</p>
          ) : (
            <div className="divide-y">
              {recent.map((prop) => (
                <div key={prop.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-800">{prop.titre}</p>
                    <p className="text-sm text-slate-500">{prop.type} • {prop.actionType === 'sale' ? 'À vendre' : 'À louer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(prop.priceNumeric || 0)}</p>
                    <p className="text-xs text-slate-400">
                      {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(prop.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
