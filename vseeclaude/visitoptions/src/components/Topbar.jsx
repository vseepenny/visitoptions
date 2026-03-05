export default function Topbar() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-[#08ac60] text-white text-sm font-bold rounded w-7 h-7 flex items-center justify-center">
            V
          </div>
          <span className="text-[#08ac60] font-semibold text-base">VSee Clinic</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-[#4a5565]">
          <a href="#" className="hover:text-[#08ac60]">Dashboard</a>
          <a href="#" className="hover:text-[#08ac60]">Patients</a>
          <a href="#" className="hover:text-[#08ac60]">Calendar</a>
          <div className="flex items-center gap-2">
            <div className="bg-gray-300 rounded-full w-7 h-7" />
            <span>Dr. Provider</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
