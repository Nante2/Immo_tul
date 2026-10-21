const stats = [
  { number: "500+", label: "Biens vendus" },
  { number: "12", label: "Années d'expérience" },
  { number: "200+", label: "Clients satisfaits" },
  { number: "50+", label: "Biens en location" },
];

const HomeStats = () => {
  return (
    <section className="py-16 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-white/70 text-sm md:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeStats;
