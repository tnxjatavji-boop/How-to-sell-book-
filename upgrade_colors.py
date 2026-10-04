import re

with open('src/components/AssetLogo.tsx', 'r') as f:
    content = f.read()

color_map = {
    '#F7931A': ('#F7931A', '#D87B11'), # BTC
    '#627EEA': ('#627EEA', '#4863C9'), # ETH
    '#14151A': ('#2B2E36', '#14151A'), # SOL
    '#F3BA2F': ('#F3BA2F', '#DDA01B'), # BNB
    '#23292F': ('#343A40', '#111417'), # XRP
    '#C2A633': ('#E0C23E', '#A88E28'), # DOGE
    '#0098EA': ('#00B4FF', '#007AC0'), # TON
    '#FFA409': ('#FFBA3D', '#E58F00'), # SHIB
    '#44973D': ('#55B24E', '#357A2E'), # PEPE
    '#8247E5': ('#9D5EFF', '#6732C1'), # POL
    '#375BD2': ('#4A70ED', '#2945A6'), # LINK
    '#345D9D': ('#4574C2', '#26467A'), # LTC
    '#E6007A': ('#FF1A96', '#B80062'), # DOT
    '#EF0027': ('#FF1A43', '#C2001F'), # TRX
    '#0033AD': ('#0047E0', '#00247D'), # ADA
    '#E84142': ('#FF595A', '#C43132'), # AVAX
    '#000000': ('#222222', '#000000'), # NEAR/Apple
    '#4CA2FF': ('#6BB5FF', '#2A87ED'), # SUI
    '#22252A': ('#383D45', '#131518'), # APT
    '#FF007A': ('#FF3399', '#D60066'), # UNI
    '#2E3148': ('#424666', '#1F2131'), # ATOM
    '#E82127': ('#FF383F', '#BF171C'), # TSLA
    '#76B900': ('#8FDE00', '#5A8D00'), # NVDA
    '#1E293B': ('#334155', '#0F172A'), # MSFT/Generic
    '#232F3E': ('#374A61', '#121921'), # AMZN
    '#F8FAFC': ('#FFFFFF', '#E2E8F0'), # GOOG
    '#0668E1': ('#2B8BFF', '#044DA8'), # META
    '#141414': ('#2B2B2B', '#000000'), # NFLX
    '#ED1C24': ('#FF333B', '#B81118'), # AMD
    '#0071C5': ('#008BF0', '#005596'), # INTC
    '#FF6000': ('#FF8533', '#CC4D00'), # BABA
    '#F40000': ('#FF2B2B', '#C20000'), # KO
    '#1A1F71': ('#272E9C', '#101347'), # V
    '#0A0A0A': ('#1A1A1A', '#000000'), # MA
    '#D4AF37': ('#EBC242', '#AA8A2A'), # Gold
    '#94A3B8': ('#CBD5E1', '#64748B'), # Silver
    '#64748B': ('#94A3B8', '#475569'), # Plat
    '#0284C7': ('#0EA5E9', '#0369A1'), # NG/Nasdaq
    '#D97706': ('#F59E0B', '#B45309'), # Casino
    '#1D4ED8': ('#2563EB', '#1E3A8A'), # SPX
    '#334155': ('#475569', '#1E293B'), # DJI
    '#DC2626': ('#EF4444', '#991B1B'), # GER/JP
    '#1E3A8A': ('#1E40AF', '#172554'), # UK/USDINR
    '#B91C1C': ('#DC2626', '#7F1D1D'), # HSI
    '#003399': ('#0047D6', '#002266'), # EURUSD
    '#C8102E': ('#E5173A', '#9B0B22'), # GBPUSD
    '#00247D': ('#0036B8', '#001345'), # USDJPY
    '#00008B': ('#0000D1', '#00005C'), # AUDUSD
}

def replace_color(match):
    bg_color = match.group(1)
    if bg_color in color_map:
        f, t = color_map[bg_color]
        return f'gradientFrom="{f}" gradientTo="{t}"'
    return match.group(0)

# Replace bgColor="..." with gradientFrom="..." gradientTo="..."
new_content = re.sub(r'bgColor="([^"]+)"', replace_color, content)

with open('src/components/AssetLogo.tsx', 'w') as f:
    f.write(new_content)

print("Replacement complete.")
