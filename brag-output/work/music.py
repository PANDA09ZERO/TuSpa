# Música del promo tuSpa: 120 BPM, Re mayor, 24 s. Todo sobre una sola grilla de tiempos.
# Uso: python -I music.py <salida.wav>
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 24.0
BEAT = 0.5  # 120 BPM
N = int(SR * DUR)
t_all = np.arange(N) / SR

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)

def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    sus = max(n - a - d - r, 0)
    e = np.concatenate([np.linspace(0, 1, max(a, 1)), np.linspace(1, s, max(d, 1)), np.full(sus, s), np.linspace(s, 0, max(r, 1))])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))

def lowpass(x, fc):
    return sosfilt(butter(2, fc, btype="low", fs=SR, output="sos"), x)

def highpass(x, fc):
    return sosfilt(butter(2, fc, btype="high", fs=SR, output="sos"), x)

def place(buf, sig, t0, gain=1.0):
    i = int(round(t0 * SR))
    j = min(i + len(sig), len(buf))
    if i < len(buf):
        buf[i:j] += sig[: j - i] * gain

pad = np.zeros(N); bass = np.zeros(N); drums = np.zeros(N); fx = np.zeros(N)

# Progresión (un acorde por compás de 2 s): D, Bm, G, A
chords = [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]]
roots = [38, 35, 31, 33]

# Pad: triadas cálidas con leve desafinado
for bar in range(12):
    t0 = bar * 2.0
    ch = chords[bar % 4]
    n = int(2.3 * SR)
    tt = np.arange(n) / SR
    s = np.zeros(n)
    for note in ch:
        f = midi(note)
        for det in (-0.12, 0.12):
            ff = f * 2 ** (det / 12)
            s += np.sin(2 * np.pi * ff * tt) + 0.25 * np.sin(2 * np.pi * 2 * ff * tt)
    s *= env_adsr(n, 0.35, 0.3, 0.8, 0.5)
    g = 0.05 if bar < 11 else 0.06
    place(pad, s, t0, g)
pad = lowpass(pad, 2200)

# Bajo: desde la revelación (3 s) hasta 22 s, en los tiempos 1 y 3
def bass_note(f, length=0.45):
    n = int(length * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt)
    return s * env_adsr(n, 0.005, 0.12, 0.6, 0.12)
t = 3.0
while t < 22.0 - 1e-9:
    bar = int(t // 2.0)
    place(bass, bass_note(midi(roots[bar % 4])), t, 0.18)
    t += 1.0
bass = lowpass(bass, 900)

# Batería suave
def kick():
    n = int(0.35 * SR); tt = np.arange(n) / SR
    f = 110 * np.exp(-tt * 18) + 45
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 9)
def clap():
    n = int(0.22 * SR); tt = np.arange(n) / SR
    rng = np.random.default_rng(7)
    s = highpass(rng.standard_normal(n), 1200) * np.exp(-tt * 22)
    return lowpass(s, 6000)
def hat():
    n = int(0.06 * SR); tt = np.arange(n) / SR
    rng = np.random.default_rng(11)
    return highpass(rng.standard_normal(n), 7000) * np.exp(-tt * 70)

k, c, h = kick(), clap(), hat()
t = 3.0
while t < 22.0 - 1e-9:
    beat_in_bar = int(round((t % 2.0) / BEAT))
    if beat_in_bar in (0, 2):
        place(drums, k, t, 0.42)
    else:
        place(drums, c, t, 0.10)
    place(drums, h, t + BEAT / 2, 0.035)
    t += BEAT

# Efectos en la misma tonalidad: pluck (campanita) y swell de ruido filtrado
def pluck(note, length=0.6):
    n = int(length * SR); tt = np.arange(n) / SR
    f = midi(note)
    s = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * 2 * f * tt) + 0.15 * np.sin(2 * np.pi * 3 * f * tt)
    return s * np.exp(-tt * 7) * env_adsr(n, 0.003, 0.05, 1, 0.05)
def swell(length=0.45):
    n = int(length * SR); tt = np.arange(n) / SR
    rng = np.random.default_rng(3)
    s = lowpass(highpass(rng.standard_normal(n), 400), 3500)
    return s * (tt / length) ** 2

# Gancho: clic en cada línea y golpe al tachar
place(fx, pluck(81, 0.3), 0.2, 0.05)
place(fx, pluck(78, 0.3), 1.0, 0.05)
place(fx, kick(), 2.0, 0.35)
place(fx, clap(), 2.0, 0.12)
# Swells antes de cada corte
for cut in (3.0, 6.0, 10.0, 14.0, 18.0, 20.0):
    place(fx, swell(), cut - 0.45, 0.05)
# Plucks en eventos (en tiempos), notas de la escala de Re mayor
events = [(3.0, 74), (6.0, 78), (7.5, 81), (10.0, 76), (11.0, 74), (11.5, 76), (12.0, 78), (12.5, 81),
          (14.0, 78), (15.5, 81), (16.5, 83), (18.0, 74), (18.5, 78), (19.0, 81), (19.5, 86),
          (20.0, 78), (21.0, 81), (21.5, 86)]
for tt_, note in events:
    place(fx, pluck(note), tt_, 0.07)
# Acorde final que se apaga
n = int(2.4 * SR); tt = np.arange(n) / SR
final = sum(np.sin(2 * np.pi * midi(nn) * tt) for nn in (62, 66, 69, 74)) * np.exp(-tt * 1.6)
place(fx, final, 21.5, 0.05)

mix = pad + bass + drums + fx
# fade de salida en el último segundo
fade = np.ones(N); fade[-int(1.0 * SR):] = np.linspace(1, 0, int(1.0 * SR))
mix *= fade
mix = mix / np.max(np.abs(mix)) * 0.85
stereo = np.stack([mix, mix], axis=1)
wavfile.write(sys.argv[1], SR, (stereo * 32767).astype(np.int16))
print("ok", DUR, "s")
