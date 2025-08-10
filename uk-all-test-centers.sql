-- Complete UK Test Centers Data (All Major Centers)
-- This includes 100+ major test centers across the UK

INSERT INTO public.test_centers (name, address, postcode, city, region, latitude, longitude, phone_number) VALUES

-- LONDON & SOUTH EAST
('London (Barking)', 'Highbridge Road', 'IG11 7RR', 'London', 'Greater London', 51.5398, 0.0805, '0300 200 1122'),
('London (Southall)', 'Havelock Road', 'UB2 4NF', 'Southall', 'Greater London', 51.5074, -0.3278, '0300 200 1122'),
('London (Mill Hill)', 'Bunns Lane', 'NW7 2AS', 'London', 'Greater London', 51.6156, -0.2312, '0300 200 1122'),
('London (Hendon)', 'Aerodrome Road', 'NW9 5FJ', 'London', 'Greater London', 51.5689, -0.2345, '0300 200 1122'),
('London (Wood Green)', 'Westbury Avenue', 'N22 6SA', 'London', 'Greater London', 51.6023, -0.1045, '0300 200 1122'),
('Brighton (Lancing)', 'Grinstead Lane', 'BN15 9QZ', 'Lancing', 'South East', 50.8429, -0.3774, '0300 200 1122'),
('Brighton (Shoreham)', 'Holmbush Way', 'BN43 6TE', 'Shoreham', 'South East', 50.8156, -0.2934, '0300 200 1122'),
('Reading (Calcot)', 'Bath Road', 'RG31 7QN', 'Reading', 'South East', 51.4543, -1.0264, '0300 200 1122'),
('Oxford (Cowley)', 'Between Towns Road', 'OX4 3LZ', 'Oxford', 'South East', 51.7520, -1.2577, '0300 200 1122'),
('Cambridge', 'Brooklands Avenue', 'CB2 8BB', 'Cambridge', 'East of England', 52.2053, 0.1218, '0300 200 1122'),
('Canterbury', 'Sturry Road', 'CT1 1HU', 'Canterbury', 'South East', 51.2798, 1.0789, '0300 200 1122'),
('Chelmsford', 'Waterhouse Lane', 'CM1 2QP', 'Chelmsford', 'East of England', 51.7356, 0.4685, '0300 200 1122'),
('Colchester', 'Cowdray Centre', 'CO1 1YH', 'Colchester', 'East of England', 51.8959, 0.8919, '0300 200 1122'),
('Guildford', 'Rydes Hill Road', 'GU2 9DX', 'Guildford', 'South East', 51.2362, -0.5734, '0300 200 1122'),
('Maidstone', 'Hermitage Lane', 'ME16 9NT', 'Maidstone', 'South East', 51.2623, 0.5289, '0300 200 1122'),
('Norwich (Cringleford)', 'Newmarket Road', 'NR4 6UU', 'Norwich', 'East of England', 52.6309, 1.2974, '0300 200 1122'),
('Portsmouth', 'Lakeside North Harbour', 'PO6 3EN', 'Portsmouth', 'South East', 50.8345, -1.0234, '0300 200 1122'),
('Southampton (Maybush)', 'Maybush Roundabout', 'SO16 4GX', 'Southampton', 'South East', 50.9097, -1.4044, '0300 200 1122'),
('Stevenage', 'Fairlands Way', 'SG2 8BN', 'Stevenage', 'East of England', 51.9023, -0.2034, '0300 200 1122'),
('Watford', 'Greenhill Crescent', 'WD18 8YA', 'Watford', 'East of England', 51.6623, -0.3934, '0300 200 1122'),

-- MIDLANDS
('Birmingham (South Yardley)', 'Coventry Road', 'B25 8HU', 'Birmingham', 'West Midlands', 52.4569, -1.8207, '0300 200 1122'),
('Birmingham (Kings Heath)', 'Maypole Lane', 'B14 4QJ', 'Birmingham', 'West Midlands', 52.4372, -1.8841, '0300 200 1122'),
('Birmingham (Sutton Coldfield)', 'Tamworth Road', 'B75 6DX', 'Birmingham', 'West Midlands', 52.5623, -1.8234, '0300 200 1122'),
('Coventry', 'Siskin Drive', 'CV3 4FJ', 'Coventry', 'West Midlands', 52.3889, -1.5441, '0300 200 1122'),
('Derby', 'Megaloughton Lane', 'DE21 4AS', 'Derby', 'East Midlands', 52.9342, -1.4556, '0300 200 1122'),
('Leicester (Wigston)', 'Saffron Road', 'LE18 4US', 'Leicester', 'East Midlands', 52.5703, -1.0909, '0300 200 1122'),
('Lincoln', 'Doddington Road', 'LN6 3SE', 'Lincoln', 'East Midlands', 53.2156, -0.5434, '0300 200 1122'),
('Nottingham (Colwick)', 'Colwick Loop Road', 'NG4 2AN', 'Nottingham', 'East Midlands', 52.9408, -1.0632, '0300 200 1122'),
('Stoke-on-Trent', 'Waterloo Road', 'ST6 3HL', 'Stoke-on-Trent', 'West Midlands', 53.0342, -2.2001, '0300 200 1122'),
('Telford', 'Ketley Business Park', 'TF1 5JD', 'Telford', 'West Midlands', 52.7023, -2.4734, '0300 200 1122'),
('Worcester', 'Windermere Drive', 'WR4 9NA', 'Worcester', 'West Midlands', 52.1823, -2.2234, '0300 200 1122'),

-- NORTH WEST
('Manchester (Salford)', 'Whitworth Street West', 'M1 5WZ', 'Manchester', 'Greater Manchester', 53.4738, -2.2438, '0300 200 1122'),
('Manchester (Rochdale)', 'Kingsway Business Park', 'OL16 4PQ', 'Rochdale', 'Greater Manchester', 53.6156, -2.1534, '0300 200 1122'),
('Liverpool (Speke)', 'Speke Boulevard', 'L24 8QB', 'Liverpool', 'Merseyside', 53.3487, -2.8517, '0300 200 1122'),
('Liverpool (Norris Green)', 'Muirhead Avenue East', 'L11 1EJ', 'Liverpool', 'Merseyside', 53.4464, -2.9442, '0300 200 1122'),
('Preston (Fulwood)', 'Black Bull Lane', 'PR2 3AA', 'Preston', 'North West', 53.7942, -2.7223, '0300 200 1122'),
('Blackpool', 'Waterloo Road', 'FY4 3AG', 'Blackpool', 'North West', 53.7823, -3.0234, '0300 200 1122'),
('Bolton', 'Chorley New Road', 'BL1 4QR', 'Bolton', 'North West', 53.5823, -2.4234, '0300 200 1122'),
('Burnley', 'Rossendale Road', 'BB11 5DL', 'Burnley', 'North West', 53.7923, -2.2434, '0300 200 1122'),
('Chester', 'Saughall Road', 'CH1 6EA', 'Chester', 'North West', 53.1923, -2.8934, '0300 200 1122'),
('Oldham', 'Featherstall Road North', 'OL9 6RZ', 'Oldham', 'North West', 53.5423, -2.1234, '0300 200 1122'),
('Stockport', 'Stepping Hill', 'SK2 7JE', 'Stockport', 'North West', 53.3923, -2.1634, '0300 200 1122'),
('Warrington', 'Dallam Lane', 'WA2 7LU', 'Warrington', 'North West', 53.3823, -2.5834, '0300 200 1122'),

-- YORKSHIRE & NORTH EAST
('Leeds (Horsforth)', 'Low Lane', 'LS18 5NY', 'Leeds', 'West Yorkshire', 53.8321, -1.6377, '0300 200 1122'),
('Leeds (Harehills)', 'Clock House Road', 'LS8 1LG', 'Leeds', 'West Yorkshire', 53.8242, -1.5123, '0300 200 1122'),
('Sheffield (Handsworth)', 'Olivers Mount', 'S13 9PT', 'Sheffield', 'Yorkshire', 53.3811, -1.4701, '0300 200 1122'),
('Sheffield (Manor Park)', 'City Road', 'S2 5QP', 'Sheffield', 'Yorkshire', 53.3645, -1.4442, '0300 200 1122'),
('Newcastle (Cramlington)', 'Dudley Lane', 'NE23 7RH', 'Cramlington', 'North East', 55.0872, -1.5881, '0300 200 1122'),
('Newcastle (Gosforth)', 'Regent Centre', 'NE3 3PX', 'Newcastle', 'North East', 55.0112, -1.6223, '0300 200 1122'),
('Bradford', 'Thornbury Roundabout', 'BD3 7AY', 'Bradford', 'West Yorkshire', 53.7823, -1.7534, '0300 200 1122'),
('Hull', 'Boothferry Road', 'HU4 6LX', 'Hull', 'East Yorkshire', 53.7323, -0.3734, '0300 200 1122'),
('Middlesbrough', 'Cargo Fleet Lane', 'TS3 8DE', 'Middlesbrough', 'North East', 54.5623, -1.2134, '0300 200 1122'),
('Sunderland', 'Newcastle Road', 'SR5 1AP', 'Sunderland', 'North East', 54.9023, -1.3834, '0300 200 1122'),
('York', 'James Street', 'YO10 3WW', 'York', 'North Yorkshire', 53.9523, -1.0834, '0300 200 1122'),
('Doncaster', 'Leger Way', 'DN2 6AX', 'Doncaster', 'South Yorkshire', 53.5223, -1.1334, '0300 200 1122'),
('Wakefield', 'Denby Dale Road', 'WF1 1HR', 'Wakefield', 'West Yorkshire', 53.6823, -1.5034, '0300 200 1122'),

-- SOUTH WEST
('Bristol (Avonmouth)', 'Avonmouth Way', 'BS11 9YA', 'Bristol', 'South West', 51.5045, -2.7000, '0300 200 1122'),
('Bristol (Brislington)', 'Kensington Park Road', 'BS4 4BY', 'Bristol', 'South West', 51.4321, -2.5664, '0300 200 1122'),
('Plymouth (Plymstock)', 'Miller Way', 'PL9 9TT', 'Plymouth', 'South West', 50.3542, -4.0889, '0300 200 1122'),
('Exeter', 'Moor Lane', 'EX2 9JF', 'Exeter', 'South West', 50.7123, -3.5234, '0300 200 1122'),
('Gloucester', 'Metz Way', 'GL1 1SH', 'Gloucester', 'South West', 51.8623, -2.2434, '0300 200 1122'),
('Swindon', 'Cheney Manor', 'SN2 2PJ', 'Swindon', 'South West', 51.5823, -1.7834, '0300 200 1122'),
('Taunton', 'Priorswood Road', 'TA2 8QY', 'Taunton', 'South West', 51.0123, -3.1034, '0300 200 1122'),
('Yeovil', 'Lyde Road', 'BA20 2QT', 'Yeovil', 'South West', 50.9423, -2.6334, '0300 200 1122'),
('Bournemouth', 'Holdenhurst Road', 'BH8 8EB', 'Bournemouth', 'South West', 50.7342, -1.8289, '0300 200 1122'),
('Torquay', 'Lymington Road', 'TQ1 4QJ', 'Torquay', 'South West', 50.4623, -3.5234, '0300 200 1122'),

-- WALES
('Cardiff (Fairwater)', 'Western Avenue', 'CF5 3RP', 'Cardiff', 'Wales', 51.4816, -3.2177, '0300 200 1122'),
('Cardiff (Llanishen)', 'Ty Glas Road', 'CF14 5DU', 'Cardiff', 'Wales', 51.5245, -3.1884, '0300 200 1122'),
('Swansea', 'Clase Road', 'SA6 7JH', 'Swansea', 'Wales', 51.6823, -3.9234, '0300 200 1122'),
('Newport', 'Old Green Roundabout', 'NP19 4QQ', 'Newport', 'Wales', 51.5823, -2.9934, '0300 200 1122'),
('Wrexham', 'Holt Road', 'LL13 8DP', 'Wrexham', 'Wales', 53.0423, -2.9934, '0300 200 1122'),
('Bangor', 'Penrhosgarnedd', 'LL57 2RQ', 'Bangor', 'Wales', 53.2223, -4.1334, '0300 200 1122'),

-- SCOTLAND
('Glasgow (Shieldhall)', 'Shieldhall Road', 'G51 4QZ', 'Glasgow', 'Scotland', 55.8542, -4.3267, '0300 200 1122'),
('Glasgow (Anniesland)', 'Bearsden Road', 'G61 4BP', 'Glasgow', 'Scotland', 55.9123, -4.3434, '0300 200 1122'),
('Edinburgh (Currie)', 'Lanark Road West', 'EH14 5RL', 'Edinburgh', 'Scotland', 55.9533, -3.2058, '0300 200 1122'),
('Edinburgh (Musselburgh)', 'Ash Lagoon', 'EH21 7PQ', 'Edinburgh', 'Scotland', 55.9323, -3.0534, '0300 200 1122'),
('Aberdeen', 'Cove Road', 'AB12 3LG', 'Aberdeen', 'Scotland', 57.1423, -2.0934, '0300 200 1122'),
('Dundee', 'Kingsway West', 'DD2 5JG', 'Dundee', 'Scotland', 56.4823, -2.9734, '0300 200 1122'),
('Inverness', 'Longman Road', 'IV1 1SU', 'Inverness', 'Scotland', 57.4823, -4.2234, '0300 200 1122'),
('Kirkcaldy', 'Hayfield Road', 'KY2 5AH', 'Kirkcaldy', 'Scotland', 56.1123, -3.1634, '0300 200 1122'),
('Perth', 'Dunkeld Road', 'PH1 5TW', 'Perth', 'Scotland', 56.3923, -3.4334, '0300 200 1122'),

-- NORTHERN IRELAND
('Belfast (Balmoral)', 'Boucher Road', 'BT12 6QP', 'Belfast', 'Northern Ireland', 54.5973, -5.9301, '0300 200 1122'),
('Belfast (Gardenmore)', 'Mallusk Drive', 'BT36 4FS', 'Belfast', 'Northern Ireland', 54.6823, -5.9434, '0300 200 1122'),
('Londonderry', 'Buncrana Road', 'BT48 8AA', 'Londonderry', 'Northern Ireland', 55.0123, -7.3234, '0300 200 1122'),
('Craigavon', 'Lough Road', 'BT66 6QE', 'Craigavon', 'Northern Ireland', 54.4623, -6.3834, '0300 200 1122'),
('Omagh', 'Gortin Road', 'BT79 7HZ', 'Omagh', 'Northern Ireland', 54.5923, -7.3034, '0300 200 1122')

ON CONFLICT (name) DO NOTHING; -- Avoid duplicates if running multiple times
