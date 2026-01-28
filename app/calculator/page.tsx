'use client';

import { useState } from 'react';

type TabType = 'back' | 'lay' | 'dutching';

interface Horse {
  id: number;
  odds: string;
}

export default function BettingCalculator() {
  const [activeTab, setActiveTab] = useState<TabType>('back');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="page-header mb-8">
        <h1>Betting Calculator</h1>
        <p className="page-subtitle">
          Calculate your returns for Back Bets, Lay Bets, and Dutching
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b-2 border-purple-500">
        <button
          onClick={() => setActiveTab('back')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'back'
              ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white border-b-4 border-purple-400'
              : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
          }`}
        >
          Back Bet
        </button>
        <button
          onClick={() => setActiveTab('lay')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'lay'
              ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white border-b-4 border-purple-400'
              : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
          }`}
        >
          Lay Bet
        </button>
        <button
          onClick={() => setActiveTab('dutching')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'dutching'
              ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white border-b-4 border-purple-400'
              : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
          }`}
        >
          Dutching
        </button>
      </div>

      {/* Calculator Content */}
      <div className="content-box">
        {activeTab === 'back' && <BackBetCalculator />}
        {activeTab === 'lay' && <LayBetCalculator />}
        {activeTab === 'dutching' && <DutchingCalculator />}
      </div>
    </div>
  );
}

// Back Bet Calculator Component
function BackBetCalculator() {
  const [stake, setStake] = useState('10');
  const [odds, setOdds] = useState('3.00');
  const [commission, setCommission] = useState('5');

  const calculateBackBet = () => {
    const stakeNum = parseFloat(stake) || 0;
    const oddsNum = parseFloat(odds) || 0;
    const commissionNum = parseFloat(commission) || 0;

    const grossProfit = stakeNum * (oddsNum - 1);
    const commissionPaid = (grossProfit * commissionNum) / 100;
    const netProfit = grossProfit - commissionPaid;
    const totalReturn = stakeNum + netProfit;

    return {
      grossProfit: grossProfit.toFixed(2),
      commissionPaid: commissionPaid.toFixed(2),
      netProfit: netProfit.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
    };
  };

  const results = calculateBackBet();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-200 mb-4">Back Bet Calculator</h2>
      
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-purple-200 font-semibold mb-2">
            Stake ($)
          </label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="w-full px-4 py-3 bg-black/40 border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
            placeholder="10.00"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-purple-200 font-semibold mb-2">
            Odds
          </label>
          <input
            type="number"
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
            className="w-full px-4 py-3 bg-black/40 border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
            placeholder="3.00"
            step="0.01"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-purple-200 font-semibold mb-2">
            Commission: {commission}%
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-purple-300 mt-1">
            <span>0%</span>
            <span>5%</span>
            <span>10%</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-lg border-2 border-purple-500">
        <h3 className="text-xl font-bold text-purple-200 mb-4">Results</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-black/40 p-4 rounded-lg">
            <p className="text-purple-300 text-sm mb-1">Gross Profit</p>
            <p className="text-2xl font-bold text-white">${results.grossProfit}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-lg">
            <p className="text-purple-300 text-sm mb-1">Commission Paid</p>
            <p className="text-2xl font-bold text-red-400">${results.commissionPaid}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-lg">
            <p className="text-purple-300 text-sm mb-1">Net Profit</p>
            <p className="text-2xl font-bold text-green-400">${results.netProfit}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-lg">
            <p className="text-purple-300 text-sm mb-1">Total Return</p>
            <p className="text-2xl font-bold text-yellow-400">${results.totalReturn}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lay Bet Calculator Component
function LayBetCalculator() {
  const [backersStake, setBackersStake] = useState('10');
  const [layOdds, setLayOdds] = useState('3.00');
  const [commission, setCommission] = useState('5');

  const calculateLayBet = () => {
    const backersStakeNum = parseFloat(backersStake) || 0;
    const layOddsNum = parseFloat(layOdds) || 0;
    const commissionNum = parseFloat(commission) || 0;

    const liability = backersStakeNum * (layOddsNum - 1);
    const grossProfit = backersStakeNum;
    const commissionPaid = (grossProfit * commissionNum) / 100;
    const netProfit = grossProfit - commissionPaid;

    return {
      liability: liability.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      commissionPaid: commissionPaid.toFixed(2),
      netProfit: netProfit.toFixed(2),
    };
  };

  const results = calculateLayBet();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-200 mb-4">Lay Bet Calculator</h2>
      
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-purple-200 font-semibold mb-2">
            Backer&apos;s Stake ($)
          </label>
          <input
            type="number"
            value={backersStake}
            onChange={(e) => setBackersStake(e.target.value)}
            className="w-full px-4 py-3 bg-black/40 border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
            placeholder="10.00"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-purple-200 font-semibold mb-2">
            Lay Odds
          </label>
          <input
            type="number"
            value={layOdds}
            onChange={(e) => setLayOdds(e.target.value)}
            className="w-full px-4 py-3 bg-black/40 border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
            placeholder="3.00"
            step="0.01"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-purple-200 font-semibold mb-2">
            Commission: {commission}%
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-purple-300 mt-1">
            <span>0%</span>
            <span>5%</span>
            <span>10%</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-lg border-2 border-purple-500">
        <h3 className="text-xl font-bold text-purple-200 mb-4">Results</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-black/40 p-4 rounded-lg">
            <p className="text-purple-300 text-sm mb-1">Liability</p>
            <p className="text-2xl font-bold text-red-400">${results.liability}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-lg">
            <p className="text-purple-300 text-sm mb-1">Gross Profit</p>
            <p className="text-2xl font-bold text-white">${results.grossProfit}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-lg">
            <p className="text-purple-300 text-sm mb-1">Commission Paid</p>
            <p className="text-2xl font-bold text-red-400">${results.commissionPaid}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-lg">
            <p className="text-purple-300 text-sm mb-1">Net Profit</p>
            <p className="text-2xl font-bold text-green-400">${results.netProfit}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dutching Calculator Component
function DutchingCalculator() {
  const [totalStake, setTotalStake] = useState('100');
  const [commission, setCommission] = useState('5');
  const [horses, setHorses] = useState<Horse[]>([
    { id: 1, odds: '3.00' },
    { id: 2, odds: '4.00' },
  ]);

  const addHorse = () => {
    const newId = horses.length > 0 ? Math.max(...horses.map(h => h.id)) + 1 : 1;
    setHorses([...horses, { id: newId, odds: '5.00' }]);
  };

  const removeHorse = (id: number) => {
    if (horses.length > 1) {
      setHorses(horses.filter(h => h.id !== id));
    }
  };

  const updateHorseOdds = (id: number, odds: string) => {
    setHorses(horses.map(h => h.id === id ? { ...h, odds } : h));
  };

  const calculateDutching = () => {
    const totalStakeNum = parseFloat(totalStake) || 0;
    const commissionNum = parseFloat(commission) || 0;

    // Calculate reciprocal of odds sum
    const reciprocalSum = horses.reduce((sum, horse) => {
      const oddsNum = parseFloat(horse.odds) || 0;
      return sum + (oddsNum > 0 ? 1 / oddsNum : 0);
    }, 0);

    if (reciprocalSum === 0) {
      return horses.map(horse => ({
        id: horse.id,
        stake: '0.00',
        grossProfit: '0.00',
        commissionPaid: '0.00',
        netProfit: '0.00',
      }));
    }

    return horses.map(horse => {
      const oddsNum = parseFloat(horse.odds) || 0;
      if (oddsNum === 0) {
        return {
          id: horse.id,
          stake: '0.00',
          grossProfit: '0.00',
          commissionPaid: '0.00',
          netProfit: '0.00',
        };
      }

      const stakeForHorse = totalStakeNum / (reciprocalSum * oddsNum);
      const grossProfit = stakeForHorse * (oddsNum - 1);
      const commissionPaid = (grossProfit * commissionNum) / 100;
      const netProfit = grossProfit - commissionPaid;

      return {
        id: horse.id,
        stake: stakeForHorse.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        commissionPaid: commissionPaid.toFixed(2),
        netProfit: netProfit.toFixed(2),
      };
    });
  };

  const results = calculateDutching();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-200 mb-4">Dutching Calculator</h2>
      
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-purple-200 font-semibold mb-2">
            Total Stake ($)
          </label>
          <input
            type="number"
            value={totalStake}
            onChange={(e) => setTotalStake(e.target.value)}
            className="w-full px-4 py-3 bg-black/40 border-2 border-purple-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
            placeholder="100.00"
            step="0.01"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-purple-200 font-semibold mb-2">
            Commission: {commission}%
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-purple-300 mt-1">
            <span>0%</span>
            <span>5%</span>
            <span>10%</span>
          </div>
        </div>
      </div>

      {/* Horses */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-200">Horses</h3>
          <button
            onClick={addHorse}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-purple-400 transition-all"
          >
            + Add Horse
          </button>
        </div>

        <div className="space-y-3">
          {horses.map((horse, index) => (
            <div key={horse.id} className="flex gap-3 items-center bg-black/30 p-4 rounded-lg border border-purple-500/50">
              <div className="flex-1">
                <label className="block text-purple-300 text-sm mb-1">
                  Horse {index + 1} Odds
                </label>
                <input
                  type="number"
                  value={horse.odds}
                  onChange={(e) => updateHorseOdds(horse.id, e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-purple-500 rounded text-white focus:outline-none focus:border-purple-400"
                  placeholder="5.00"
                  step="0.01"
                />
              </div>
              {horses.length > 1 && (
                <button
                  onClick={() => removeHorse(horse.id)}
                  className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-lg border-2 border-purple-500">
        <h3 className="text-xl font-bold text-purple-200 mb-4">Results Per Horse</h3>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={result.id} className="bg-black/40 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-purple-200 mb-3">Horse {index + 1}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-purple-300 text-xs mb-1">Stake</p>
                  <p className="text-lg font-bold text-white">${result.stake}</p>
                </div>
                <div>
                  <p className="text-purple-300 text-xs mb-1">Gross Profit</p>
                  <p className="text-lg font-bold text-white">${result.grossProfit}</p>
                </div>
                <div>
                  <p className="text-purple-300 text-xs mb-1">Commission</p>
                  <p className="text-lg font-bold text-red-400">${result.commissionPaid}</p>
                </div>
                <div>
                  <p className="text-purple-300 text-xs mb-1">Net Profit</p>
                  <p className="text-lg font-bold text-green-400">${result.netProfit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
