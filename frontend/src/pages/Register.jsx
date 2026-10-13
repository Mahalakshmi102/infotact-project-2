import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, User, Lock, Mail, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import api from '../services/api';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/register', { name, email, password });
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
            {/* Background Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl shadow-lg shadow-indigo-500/30 text-white mb-2">
                        <Zap size={28} />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white">
                        Create StreamWeaver Account
                    </h1>
                    <p className="text-xs text-slate-400">
                        High-Throughput No-Code ETL Streaming Pipeline
                    </p>
                </div>

                {error && (
                    <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-mono">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Full Name
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Data Engineer"
                                className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Work Email
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="engineer@infotact.com"
                                className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
                        <ArrowRight size={16} />
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                    Already registered?{' '}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
