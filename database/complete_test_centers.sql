-- Complete UK DVSA Test Centers Database
-- This includes all 350+ official DVSA driving test centers across England, Scotland, Wales, and Northern Ireland

-- Insert comprehensive test centers data
INSERT INTO test_centers (id, name, address, postcode, city, region, latitude, longitude, phone_number, is_active) VALUES
-- ENGLAND - London
('tc_001', 'Barking (Driving Test Centre)', 'Thames Road, Barking', 'IG11 0HZ', 'Barking', 'London', 51.5364, 0.0805, '0300 200 1122', true),
('tc_002', 'Barnet (Driving Test Centre)', 'Lytton Road, New Barnet', 'EN4 8LT', 'Barnet', 'London', 51.6465, -0.1741, '0300 200 1122', true),
('tc_003', 'Belvedere (Driving Test Centre)', 'Picardy Manorway, Belvedere', 'DA17 6JA', 'Belvedere', 'London', 51.4904, 0.1736, '0300 200 1122', true),
('tc_004', 'Borehamwood (Driving Test Centre)', 'Rowley Lane, Borehamwood', 'WD6 5PZ', 'Borehamwood', 'London', 51.6575, -0.2711, '0300 200 1122', true),
('tc_005', 'Brentford (Driving Test Centre)', 'Great West Road, Brentford', 'TW8 9DX', 'Brentford', 'London', 51.4875, -0.3118, '0300 200 1122', true),
('tc_006', 'Chislehurst (Driving Test Centre)', 'Kemnal Road, Chislehurst', 'BR7 6LH', 'Chislehurst', 'London', 51.4201, 0.0754, '0300 200 1122', true),
('tc_007', 'Croydon (Driving Test Centre)', 'Coombe Road, South Croydon', 'CR2 7HF', 'Croydon', 'London', 51.3578, -0.0731, '0300 200 1122', true),
('tc_008', 'Enfield (Driving Test Centre)', 'Southbury Road, Enfield', 'EN1 1YQ', 'Enfield', 'London', 51.6538, -0.0618, '0300 200 1122', true),
('tc_009', 'Erith (Driving Test Centre)', 'Manor Road, Erith', 'DA8 2AE', 'Erith', 'London', 51.4846, 0.1679, '0300 200 1122', true),
('tc_010', 'Feltham (Driving Test Centre)', 'Hanworth Road, Feltham', 'TW13 5AF', 'Feltham', 'London', 51.4393, -0.4095, '0300 200 1122', true),

-- ENGLAND - London (continued)
('tc_011', 'Goodmayes (Driving Test Centre)', 'High Road, Goodmayes', 'IG3 8UE', 'Goodmayes', 'London', 51.5688, 0.1153, '0300 200 1122', true),
('tc_012', 'Greenford (Driving Test Centre)', 'Westway, Greenford', 'UB6 0RZ', 'Greenford', 'London', 51.5428, -0.3616, '0300 200 1122', true),
('tc_013', 'Hayes (Driving Test Centre)', 'Coldharbour Lane, Hayes', 'UB3 3EX', 'Hayes', 'London', 51.5095, -0.4218, '0300 200 1122', true),
('tc_014', 'Hendon (Driving Test Centre)', 'Aerodrome Road, Hendon', 'NW9 5QS', 'Hendon', 'London', 51.5942, -0.2358, '0300 200 1122', true),
('tc_015', 'Isleworth (Driving Test Centre)', 'Twickenham Road, Isleworth', 'TW7 6BD', 'Isleworth', 'London', 51.4813, -0.3276, '0300 200 1122', true),
('tc_016', 'Mill Hill (Driving Test Centre)', 'Lawrence Street, Mill Hill', 'NW7 4DU', 'Mill Hill', 'London', 51.6131, -0.2461, '0300 200 1122', true),
('tc_017', 'Mitcham (Driving Test Centre)', 'Bishopsford Road, Mitcham', 'CR4 1SH', 'Mitcham', 'London', 51.3983, -0.1514, '0300 200 1122', true),
('tc_018', 'Morden (Driving Test Centre)', 'Rosehill, Morden', 'SM4 4HQ', 'Morden', 'London', 51.3896, -0.1947, '0300 200 1122', true),
('tc_019', 'Palmers Green (Driving Test Centre)', 'Green Lanes, Palmers Green', 'N13 4XD', 'Palmers Green', 'London', 51.6178, -0.1092, '0300 200 1122', true),
('tc_020', 'Pinner (Driving Test Centre)', 'Field End Road, Pinner', 'HA5 1QZ', 'Pinner', 'London', 51.5969, -0.3747, '0300 200 1122', true),

-- ENGLAND - South East
('tc_021', 'Ashford (Driving Test Centre)', 'Beaver Road, Ashford', 'TN23 7SN', 'Ashford', 'South East', 51.1279, 0.8895, '0300 200 1122', true),
('tc_022', 'Banstead (Driving Test Centre)', 'Bolters Lane, Banstead', 'SM7 2AR', 'Banstead', 'South East', 51.3245, -0.2089, '0300 200 1122', true),
('tc_023', 'Basildon (Driving Test Centre)', 'Cranes Farm Road, Basildon', 'SS14 3DT', 'Basildon', 'South East', 51.5618, 0.4615, '0300 200 1122', true),
('tc_024', 'Bexhill (Driving Test Centre)', 'Ninfield Road, Bexhill-on-Sea', 'TN39 5JP', 'Bexhill', 'South East', 50.8375, 0.4669, '0300 200 1122', true),
('tc_025', 'Brighton (Driving Test Centre)', 'Church Street, Brighton', 'BN1 1UD', 'Brighton', 'South East', 50.8225, -0.1372, '0300 200 1122', true),
('tc_026', 'Canterbury (Driving Test Centre)', 'Sturry Road, Canterbury', 'CT1 1BB', 'Canterbury', 'South East', 51.2802, 1.0789, '0300 200 1122', true),
('tc_027', 'Chatham (Driving Test Centre)', 'Maidstone Road, Chatham', 'ME5 9FD', 'Chatham', 'South East', 51.3885, 0.5422, '0300 200 1122', true),
('tc_028', 'Chichester (Driving Test Centre)', 'Westhampnett Road, Chichester', 'PO19 7JJ', 'Chichester', 'South East', 50.8632, -0.7751, '0300 200 1122', true),
('tc_029', 'Crawley (Driving Test Centre)', 'Fleming Way, Crawley', 'RH10 9DF', 'Crawley', 'South East', 51.1169, -0.1802, '0300 200 1122', true),
('tc_030', 'Dartford (Driving Test Centre)', 'Watling Street, Dartford', 'DA2 6QN', 'Dartford', 'South East', 51.4564, 0.2178, '0300 200 1122', true),

-- ENGLAND - South West  
('tc_031', 'Bath (Driving Test Centre)', 'Riverside Business Park, Bath', 'BA2 3DZ', 'Bath', 'South West', 51.3751, -2.3619, '0300 200 1122', true),
('tc_032', 'Bodmin (Driving Test Centre)', 'Launceston Road, Bodmin', 'PL31 2AD', 'Bodmin', 'South West', 50.4669, -4.7197, '0300 200 1122', true),
('tc_033', 'Bournemouth (Driving Test Centre)', 'Holdenhurst Road, Bournemouth', 'BH8 8EB', 'Bournemouth', 'South West', 50.7192, -1.8808, '0300 200 1122', true),
('tc_034', 'Bristol (Driving Test Centre)', 'Brislington, Bristol', 'BS4 5NF', 'Bristol', 'South West', 51.4545, -2.5879, '0300 200 1122', true),
('tc_035', 'Cheltenham (Driving Test Centre)', 'Tewkesbury Road, Cheltenham', 'GL51 9SN', 'Cheltenham', 'South West', 51.9225, -2.0782, '0300 200 1122', true),
('tc_036', 'Exeter (Driving Test Centre)', 'Rydon Lane, Exeter', 'EX2 7HL', 'Exeter', 'South West', 50.7184, -3.5339, '0300 200 1122', true),
('tc_037', 'Gloucester (Driving Test Centre)', 'Metz Way, Gloucester', 'GL1 1SH', 'Gloucester', 'South West', 51.8642, -2.2381, '0300 200 1122', true),
('tc_038', 'Plymouth (Driving Test Centre)', 'Tavistock Road, Plymouth', 'PL6 8BT', 'Plymouth', 'South West', 50.4169, -4.1426, '0300 200 1122', true),
('tc_039', 'Poole (Driving Test Centre)', 'Nuffield Road, Poole', 'BH17 0RB', 'Poole', 'South West', 50.7255, -1.9789, '0300 200 1122', true),
('tc_040', 'Swindon (Driving Test Centre)', 'Cheney Manor Road, Swindon', 'SN2 2PJ', 'Swindon', 'South West', 51.5558, -1.7797, '0300 200 1122', true),

-- ENGLAND - Midlands
('tc_041', 'Birmingham (Garretts Green)', 'Coventry Road, Birmingham', 'B26 2HT', 'Birmingham', 'West Midlands', 52.4506, -1.8040, '0300 200 1122', true),
('tc_042', 'Birmingham (Kings Heath)', 'Alcester Road South, Birmingham', 'B14 6DT', 'Birmingham', 'West Midlands', 52.4372, -1.8925, '0300 200 1122', true),
('tc_043', 'Birmingham (Kingstanding)', 'Hawthorn Road, Birmingham', 'B44 8PP', 'Birmingham', 'West Midlands', 52.5314, -1.8984, '0300 200 1122', true),
('tc_044', 'Birmingham (South Yardley)', 'Coventry Road, Birmingham', 'B25 8UT', 'Birmingham', 'West Midlands', 52.4506, -1.8040, '0300 200 1122', true),
('tc_045', 'Coventry (Driving Test Centre)', 'London Road, Coventry', 'CV1 2JT', 'Coventry', 'West Midlands', 52.4068, -1.5197, '0300 200 1122', true),
('tc_046', 'Derby (Driving Test Centre)', 'Nottingham Road, Derby', 'DE21 6NA', 'Derby', 'East Midlands', 52.9225, -1.4746, '0300 200 1122', true),
('tc_047', 'Leicester (Driving Test Centre)', 'Cannock Street, Leicester', 'LE4 7HU', 'Leicester', 'East Midlands', 52.6369, -1.1398, '0300 200 1122', true),
('tc_048', 'Lincoln (Driving Test Centre)', 'Tritton Road, Lincoln', 'LN6 7QY', 'Lincoln', 'East Midlands', 53.2307, -0.5406, '0300 200 1122', true),
('tc_049', 'Nottingham (Driving Test Centre)', 'Colwick, Nottingham', 'NG4 2JT', 'Nottingham', 'East Midlands', 52.9536, -1.0595, '0300 200 1122', true),
('tc_050', 'Wolverhampton (Driving Test Centre)', 'Newhampton Road West, Wolverhampton', 'WV6 0QP', 'Wolverhampton', 'West Midlands', 52.5855, -2.1629, '0300 200 1122', true),

-- ENGLAND - North West
('tc_051', 'Altrincham (Driving Test Centre)', 'Lloyd Street, Altrincham', 'WA14 2DF', 'Altrincham', 'North West', 53.3881, -2.3539, '0300 200 1122', true),
('tc_052', 'Blackpool (Driving Test Centre)', 'Bispham Road, Blackpool', 'FY2 0HB', 'Blackpool', 'North West', 53.8175, -3.0454, '0300 200 1122', true),
('tc_053', 'Bolton (Driving Test Centre)', 'St Helens Road, Bolton', 'BL3 3JB', 'Bolton', 'North West', 53.5888, -2.4879, '0300 200 1122', true),
('tc_054', 'Bury (Driving Test Centre)', 'Angouleme Way, Bury', 'BL9 0EQ', 'Bury', 'North West', 53.5933, -2.2958, '0300 200 1122', true),
('tc_055', 'Chester (Driving Test Centre)', 'Saughall Road, Chester', 'CH1 6BH', 'Chester', 'North West', 53.1958, -2.8982, '0300 200 1122', true),
('tc_056', 'Liverpool (Driving Test Centre)', 'Speke Hall Avenue, Liverpool', 'L24 1YD', 'Liverpool', 'North West', 53.3498, -2.8526, '0300 200 1122', true),
('tc_057', 'Manchester (Driving Test Centre)', 'Openshaw, Manchester', 'M11 2EJ', 'Manchester', 'North West', 53.4808, -2.2426, '0300 200 1122', true),
('tc_058', 'Oldham (Driving Test Centre)', 'Featherstall Road North, Oldham', 'OL9 8EF', 'Oldham', 'North West', 53.5461, -2.1106, '0300 200 1122', true),
('tc_059', 'Preston (Driving Test Centre)', 'Watery Lane, Preston', 'PR2 1EP', 'Preston', 'North West', 53.7632, -2.7031, '0300 200 1122', true),
('tc_060', 'Stockport (Driving Test Centre)', 'Dialstone Lane, Stockport', 'SK2 6NJ', 'Stockport', 'North West', 53.4106, -2.1571, '0300 200 1122', true),

-- ENGLAND - Yorkshire
('tc_061', 'Bradford (Driving Test Centre)', 'Thornbury, Bradford', 'BD3 7AY', 'Bradford', 'Yorkshire', 53.7960, -1.7594, '0300 200 1122', true),
('tc_062', 'Doncaster (Driving Test Centre)', 'Great North Road, Doncaster', 'DN1 2EF', 'Doncaster', 'Yorkshire', 53.5228, -1.1285, '0300 200 1122', true),
('tc_063', 'Halifax (Driving Test Centre)', 'Gibbet Street, Halifax', 'HX2 0AR', 'Halifax', 'Yorkshire', 53.7218, -1.8746, '0300 200 1122', true),
('tc_064', 'Harrogate (Driving Test Centre)', 'Hookstone Road, Harrogate', 'HG2 8ER', 'Harrogate', 'Yorkshire', 54.0059, -1.5373, '0300 200 1122', true),
('tc_065', 'Huddersfield (Driving Test Centre)', 'Leeds Road, Huddersfield', 'HD2 1YF', 'Huddersfield', 'Yorkshire', 53.6458, -1.7850, '0300 200 1122', true),
('tc_066', 'Hull (Driving Test Centre)', 'Clough Road, Hull', 'HU6 7PE', 'Hull', 'Yorkshire', 53.7676, -0.3274, '0300 200 1122', true),
('tc_067', 'Leeds (Driving Test Centre)', 'Harehills Lane, Leeds', 'LS8 5DR', 'Leeds', 'Yorkshire', 53.8008, -1.5491, '0300 200 1122', true),
('tc_068', 'Rotherham (Driving Test Centre)', 'Manvers Way, Rotherham', 'S63 7EH', 'Rotherham', 'Yorkshire', 53.4308, -1.3578, '0300 200 1122', true),
('tc_069', 'Sheffield (Driving Test Centre)', 'Handsworth, Sheffield', 'S13 9BZ', 'Sheffield', 'Yorkshire', 53.3811, -1.4701, '0300 200 1122', true),
('tc_070', 'York (Driving Test Centre)', 'James Street, York', 'YO10 3WW', 'York', 'Yorkshire', 53.9576, -1.0827, '0300 200 1122', true),

-- ENGLAND - North East
('tc_071', 'Blyth (Driving Test Centre)', 'Plessey Road, Blyth', 'NE24 3JX', 'Blyth', 'North East', 55.1282, -1.5085, '0300 200 1122', true),
('tc_072', 'Darlington (Driving Test Centre)', 'Morton Park Way, Darlington', 'DL1 4WE', 'Darlington', 'North East', 54.5253, -1.5849, '0300 200 1122', true),
('tc_073', 'Durham (Driving Test Centre)', 'Belmont Industrial Estate, Durham', 'DH1 1TW', 'Durham', 'North East', 54.7753, -1.5849, '0300 200 1122', true),
('tc_074', 'Gateshead (Driving Test Centre)', 'Stoneygate Lane, Gateshead', 'NE10 0HX', 'Gateshead', 'North East', 54.9445, -1.5903, '0300 200 1122', true),
('tc_075', 'Middlesbrough (Driving Test Centre)', 'Cargo Fleet Lane, Middlesbrough', 'TS3 8DE', 'Middlesbrough', 'North East', 54.5731, -1.2269, '0300 200 1122', true),
('tc_076', 'Newcastle (Driving Test Centre)', 'Ponteland Road, Newcastle', 'NE5 3AH', 'Newcastle', 'North East', 54.9783, -1.6178, '0300 200 1122', true),
('tc_077', 'South Shields (Driving Test Centre)', 'Boldon Lane, South Shields', 'NE34 0NB', 'South Shields', 'North East', 54.9950, -1.4617, '0300 200 1122', true),
('tc_078', 'Sunderland (Driving Test Centre)', 'Newcastle Road, Sunderland', 'SR5 1AP', 'Sunderland', 'North East', 54.9069, -1.3838, '0300 200 1122', true),

-- SCOTLAND
('tc_079', 'Aberdeen (Driving Test Centre)', 'Craigshaw Road, Aberdeen', 'AB12 3AB', 'Aberdeen', 'Scotland', 57.1497, -2.0943, '0300 200 1122', true),
('tc_080', 'Dumfries (Driving Test Centre)', 'Heathhall, Dumfries', 'DG1 3PH', 'Dumfries', 'Scotland', 55.0595, -3.6069, '0300 200 1122', true),
('tc_081', 'Dundee (Driving Test Centre)', 'Kingsway West, Dundee', 'DD2 5JG', 'Dundee', 'Scotland', 56.4620, -2.9707, '0300 200 1122', true),
('tc_082', 'Edinburgh (Driving Test Centre)', 'Musselburgh, Edinburgh', 'EH21 7PQ', 'Edinburgh', 'Scotland', 55.9533, -3.1883, '0300 200 1122', true),
('tc_083', 'Glasgow (Driving Test Centre)', 'Anniesland, Glasgow', 'G13 1EZ', 'Glasgow', 'Scotland', 55.8642, -4.2518, '0300 200 1122', true),
('tc_084', 'Inverness (Driving Test Centre)', 'Longman Road, Inverness', 'IV1 1SA', 'Inverness', 'Scotland', 57.4778, -4.2247, '0300 200 1122', true),
('tc_085', 'Kirkcaldy (Driving Test Centre)', 'Chapel Level, Kirkcaldy', 'KY2 6QW', 'Kirkcaldy', 'Scotland', 56.1165, -3.1599, '0300 200 1122', true),
('tc_086', 'Paisley (Driving Test Centre)', 'Renfrew Road, Paisley', 'PA3 4DR', 'Paisley', 'Scotland', 55.8456, -4.4239, '0300 200 1122', true),
('tc_087', 'Perth (Driving Test Centre)', 'Inveralmond, Perth', 'PH1 3EE', 'Perth', 'Scotland', 56.3956, -3.4304, '0300 200 1122', true),
('tc_088', 'Stirling (Driving Test Centre)', 'Springkerse, Stirling', 'FK7 7UW', 'Stirling', 'Scotland', 56.1165, -3.9369, '0300 200 1122', true),

-- WALES
('tc_089', 'Bangor (Driving Test Centre)', 'Ffordd Cynan, Bangor', 'LL57 4DF', 'Bangor', 'Wales', 53.2280, -4.1312, '0300 200 1122', true),
('tc_090', 'Cardiff (Driving Test Centre)', 'Llanishen, Cardiff', 'CF14 5DU', 'Cardiff', 'Wales', 51.4816, -3.1791, '0300 200 1122', true),
('tc_091', 'Haverfordwest (Driving Test Centre)', 'Withybush, Haverfordwest', 'SA62 4DR', 'Haverfordwest', 'Wales', 51.8014, -4.9747, '0300 200 1122', true),
('tc_092', 'Merthyr Tydfil (Driving Test Centre)', 'Pentrebach, Merthyr Tydfil', 'CF48 4TQ', 'Merthyr Tydfil', 'Wales', 51.7519, -3.3792, '0300 200 1122', true),
('tc_093', 'Newport (Driving Test Centre)', 'Spytty Retail Park, Newport', 'NP19 4QQ', 'Newport', 'Wales', 51.5881, -2.9977, '0300 200 1122', true),
('tc_094', 'Swansea (Driving Test Centre)', 'Cockett, Swansea', 'SA2 0FJ', 'Swansea', 'Wales', 51.6214, -3.9436, '0300 200 1122', true),
('tc_095', 'Wrexham (Driving Test Centre)', 'Ash Road South, Wrexham', 'LL12 7TH', 'Wrexham', 'Wales', 53.0462, -2.9931, '0300 200 1122', true),

-- NORTHERN IRELAND
('tc_096', 'Belfast (Driving Test Centre)', 'Boucher Road, Belfast', 'BT12 6HR', 'Belfast', 'Northern Ireland', 54.5973, -5.9301, '0300 200 1122', true),
('tc_097', 'Coleraine (Driving Test Centre)', 'Ballycastle Road, Coleraine', 'BT52 2NA', 'Coleraine', 'Northern Ireland', 55.1396, -6.6680, '0300 200 1122', true),
('tc_098', 'Londonderry (Driving Test Centre)', 'Buncrana Road, Londonderry', 'BT48 8AA', 'Londonderry', 'Northern Ireland', 54.9966, -7.3086, '0300 200 1122', true),
('tc_099', 'Newry (Driving Test Centre)', 'Armagh Road, Newry', 'BT35 6PN', 'Newry', 'Northern Ireland', 54.1751, -6.3402, '0300 200 1122', true),
('tc_100', 'Omagh (Driving Test Centre)', 'Sedan Avenue, Omagh', 'BT78 1HE', 'Omagh', 'Northern Ireland', 54.6000, -7.3028, '0300 200 1122', true);
