'use client';

interface BookingTypeGatewayProps {
  onSelect: (type: 'Group' | 'Individual') => void;
}

export function BookingTypeGateway({ onSelect }: BookingTypeGatewayProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">How would you like to stay with us?</h1>
        <p className="text-gray-500">Choose the type of booking that best suits your visit.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelect('Group')}
          className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-left hover:border-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 group min-h-[44px]"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
            <svg className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Group / Organisation</h2>
          <p className="text-sm text-gray-500">Conferences, retreats, and group events</p>
        </button>

        <button
          type="button"
          onClick={() => onSelect('Individual')}
          className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-left hover:border-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 group min-h-[44px]"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
            <svg className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Individual / Personal Stay</h2>
          <p className="text-sm text-gray-500">Private retreats and silent stays for one person. Choose your room and optional catering.</p>
        </button>
      </div>
    </div>
  );
}
