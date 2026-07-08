// ─────────────────────────────────────────────────────────────────────────────
// india-locations.ts  —  All 28 States + 8 Union Territories
// ─────────────────────────────────────────────────────────────────────────────

export interface StateData {
  districts: string[];
  cities: string[];
}

export const INDIA_LOCATIONS: Record<string, StateData> = {
  "Andhra Pradesh": {
    districts: ["Alluri Sitharama Raju","Anakapalli","Ananthapuramu","Annamayya","Bapatla","Chittoor","Dr. B.R. Ambedkar Konaseema","East Godavari","Eluru","Guntur","Kakinada","Krishna","Kurnool","Nandyal","NTR","Palnadu","Parvathipuram Manyam","Prakasam","Srikakulam","Sri Potti Sriramulu Nellore","Sri Satya Sai","Tirupati","Visakhapatnam","Vizianagaram","West Godavari","YSR Kadapa"],
    cities: ["Amaravati","Visakhapatnam","Vijayawada","Tirupati","Guntur","Nellore","Kurnool","Kakinada","Rajahmundry","Kadapa","Anantapur","Vizianagaram","Eluru","Nandyal","Ongole","Srikakulam","Machilipatnam","Chittoor","Proddatur","Hindupur"]
  },
  "Arunachal Pradesh": {
    districts: ["Anjaw","Changlang","Dibang Valley","East Kameng","East Siang","Itanagar Capital Complex","Kamle","Kra Daadi","Kurung Kumey","Lepa Rada","Lohit","Longding","Lower Dibang Valley","Lower Siang","Lower Subansiri","Namsai","Pakke-Kessang","Papum Pare","Shi Yomi","Siang","Tawang","Tirap","Upper Dibang Valley","Upper Siang","Upper Subansiri","West Kameng","West Siang"],
    cities: ["Itanagar","Naharlagun","Pasighat","Tawang","Ziro","Tezu","Bomdila","Along","Roing","Changlang","Khonsa","Aalo"]
  },
  "Assam": {
    districts: ["Bajali","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara-Mankachar","Tamulpur","Tinsukia","Udalguri","West Karbi Anglong"],
    cities: ["Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tinsukia","Tezpur","Bongaigaon","Dhubri","Diphu","Karimganj","Goalpara","Kokrajhar","Sibsagar","Lakhimpur","Haflong","Nalbari","Barpeta","Hojai","Mangaldoi"]
  },
  "Bihar": {
    districts: ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"],
    cities: ["Patna","Gaya","Bhagalpur","Muzaffarpur","Purnia","Darbhanga","Biharshareef","Arrah","Begusarai","Katihar","Munger","Chhapra","Bettiah","Motihari","Samastipur","Hajipur","Jehanabad","Sasaram","Dehri","Siwan"]
  },
  "Chhattisgarh": {
    districts: ["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada","Dhamtari","Durg","Gariaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur","Kabirdham","Kanker","Kondagaon","Korba","Koriya","Mahasamund","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sakti","Sarangarh-Bilaigarh","Sukma","Surajpur","Surguja"],
    cities: ["Raipur","Bhilai","Bilaspur","Korba","Durg","Rajnandgaon","Raigarh","Jagdalpur","Ambikapur","Dhamtari","Kanker","Chirmiri","Dantewada","Mahasamund","Janjgir"]
  },
  "Goa": {
    districts: ["North Goa","South Goa"],
    cities: ["Panaji","Margao","Vasco da Gama","Mapusa","Ponda","Bicholim","Curchorem","Quepem","Calangute","Valpoi","Sanquelim","Mormugao"]
  },
  "Gujarat": {
    districts: ["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad","Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad"],
    cities: ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar","Junagadh","Anand","Navsari","Morbi","Mehsana","Surendranagar","Bharuch","Porbandar","Vapi","Gandhidham","Patan","Dahod","Amreli","Kutch (Bhuj)"]
  },
  "Haryana": {
    districts: ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"],
    cities: ["Faridabad","Gurugram","Rohtak","Hisar","Panipat","Ambala","Yamunanagar","Sonipat","Panchkula","Bhiwani","Karnal","Sirsa","Bahadurgarh","Jind","Thanesar","Kaithal","Palwal","Narnaul","Rewari","Jhajjar"]
  },
  "Himachal Pradesh": {
    districts: ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul & Spiti","Mandi","Shimla","Sirmaur","Solan","Una"],
    cities: ["Shimla","Dharamshala","Solan","Mandi","Baddi","Nahan","Palampur","Sundernagar","Chamba","Una","Bilaspur","Kullu","Hamirpur","Keylong"]
  },
  "Jharkhand": {
    districts: ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahebganj","Seraikela Kharsawan","Simdega","West Singhbhum"],
    cities: ["Ranchi","Jamshedpur","Dhanbad","Bokaro Steel City","Deoghar","Phusro","Hazaribagh","Giridih","Ramgarh","Medininagar","Chaibasa","Dumka","Pakur","Godda","Lohardaga","Gumla"]
  },
  "Karnataka": {
    districts: ["Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban","Bidar","Chamarajanagar","Chikkaballapura","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"],
    cities: ["Bengaluru","Mysuru","Hubli","Mangaluru","Belagavi","Kalaburagi","Davanagere","Ballari","Shivamogga","Tumakuru","Vijayapura","Bidar","Raichur","Dharwad","Hospet","Gadag","Udupi","Hassan","Mandya","Chikkamagaluru","Chitradurga","Kolar","Bagalkot","Koppal"]
  },
  "Kerala": {
    districts: ["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"],
    cities: ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Alappuzha","Palakkad","Malappuram","Kottayam","Kannur","Kasaragod","Pathanamthitta","Manjeri","Vatakara","Ponnani","Chalakudy","Changanassery","Perinthalmanna","Thalassery"]
  },
  "Madhya Pradesh": {
    districts: ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Mandla","Mandsaur","Morena","Narsinghpur","Neemuch","Niwari","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"],
    cities: ["Indore","Bhopal","Jabalpur","Gwalior","Ujjain","Sagar","Ratlam","Satna","Dewas","Rewa","Chhindwara","Burhanpur","Khandwa","Bhind","Morena","Singrauli","Katni","Mandsaur","Chhatarpur","Hoshangabad","Balaghat","Vidisha","Damoh","Shahdol","Neemuch"]
  },
  "Maharashtra": {
    districts: ["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"],
    cities: ["Mumbai","Pune","Nagpur","Thane","Nashik","Aurangabad","Solapur","Amravati","Kolhapur","Nanded","Sangli","Malegaon","Akola","Latur","Dhule","Ahmednagar","Chandrapur","Jalgaon","Pimpri-Chinchwad","Bhiwandi","Navi Mumbai","Vasai-Virar","Ulhasnagar","Wardha","Gondia","Yavatmal","Parbhani"]
  },
  "Manipur": {
    districts: ["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"],
    cities: ["Imphal","Thoubal","Bishnupur","Churachandpur","Senapati","Ukhrul","Moreh","Jiribam","Kakching","Wangoi"]
  },
  "Meghalaya": {
    districts: ["East Garo Hills","East Jaintia Hills","East Khasi Hills","Mairang","North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills"],
    cities: ["Shillong","Tura","Jowai","Nongstoin","Baghmara","Resubelpara","Nongpoh","Mairang","Cherrapunji","Mawkyrwat"]
  },
  "Mizoram": {
    districts: ["Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit","Saitual","Serchhip","Siaha"],
    cities: ["Aizawl","Lunglei","Saiha","Champhai","Kolasib","Serchhip","Mamit","Lawngtlai","Zawlnuam"]
  },
  "Nagaland": {
    districts: ["Chumoukedima","Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Niuland","Noklak","Peren","Phek","Shamator","Tseminyu","Tuensang","Wokha","Zunheboto"],
    cities: ["Kohima","Dimapur","Mokokchung","Tuensang","Wokha","Mon","Zunheboto","Phek","Kiphire","Peren"]
  },
  "Odisha": {
    districts: ["Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara","Kendujhar","Khordha","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Sonepur","Sundargarh"],
    cities: ["Bhubaneswar","Cuttack","Rourkela","Berhampur","Sambalpur","Puri","Balasore","Bhadrak","Baripada","Jharsuguda","Bargarh","Angul","Dhenkanal","Kendujhar","Jeypore","Koraput","Phulbani","Rayagada","Sonepur","Bhawanipatna"]
  },
  "Punjab": {
    districts: ["Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur","Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa","Moga","Mohali","Muktsar","Nawanshahr","Pathankot","Patiala","Rupnagar","Sangrur","Tarn Taran"],
    cities: ["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali","Hoshiarpur","Pathankot","Moga","Firozpur","Batala","Gurdaspur","Abohar","Muktsar","Sangrur","Barnala","Mansa","Ropar","Kapurthala","Nawanshahr","Faridkot","Malerkotla"]
  },
  "Rajasthan": {
    districts: ["Ajmer","Alwar","Anupgarh","Balotra","Banswara","Baran","Barmer","Beawar","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Deeg","Dholpur","Didwana-Kuchaman","Dudu","Dungarpur","Ganganagar","Gangapur City","Hanumangarh","Jaipur","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur Rural","Jodhpur Urban","Karauli","Kekri","Kota","Kotputli-Behror","Nagaur","Neem ka Thana","Pali","Phalodi","Pratapgarh","Rajsamand","Salumbar","Sanchore","Sawai Madhopur","Shahpura","Sikar","Sirohi","Tonk","Udaipur"],
    cities: ["Jaipur","Jodhpur","Kota","Bikaner","Ajmer","Udaipur","Bhilwara","Alwar","Bharatpur","Sikar","Pali","Sri Ganganagar","Barmer","Jhunjhunu","Chittorgarh","Tonk","Nagaur","Hanumangarh","Churu","Jaisalmer","Bundi","Sawai Madhopur","Dungarpur","Banswara"]
  },
  "Sikkim": {
    districts: ["East Sikkim","North Sikkim","Pakyong","Soreng","South Sikkim","West Sikkim"],
    cities: ["Gangtok","Namchi","Geyzing","Mangan","Jorethang","Ravangla","Singtam","Rangpo"]
  },
  "Tamil Nadu": {
    districts: ["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Kanyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupattur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Villupuram","Virudhunagar"],
    cities: ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Erode","Tiruppur","Vellore","Thanjavur","Dindigul","Cuddalore","Thoothukudi","Kancheepuram","Nagercoil","Kumbakonam","Hosur","Nagapattinam","Ambattur","Avadi","Rajapalayam","Sivakasi","Pollachi","Namakkal","Karur","Ariyalur","Pudukkottai","Udhagamandalam","Kodaikanal","Chidambaram","Villupuram","Krishnagiri","Virudhunagar","Sivaganga","Ramanathapuram","Mayiladuthurai","Theni","Tenkasi","Ranipet"]
  },
  "Telangana": {
    districts: ["Adilabad","Bhadradri Kothagudem","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Kumuram Bheem","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal-Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal","Yadadri Bhuvanagiri"],
    cities: ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Ramagundam","Mahbubnagar","Nalgonda","Adilabad","Suryapet","Miryalaguda","Siddipet","Jagtial","Mancherial","Medak","Sangareddy","Kamareddy","Nirmal","Bhadrachalam","Gadwal","Wanaparthy"]
  },
  "Tripura": {
    districts: ["Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti","West Tripura"],
    cities: ["Agartala","Udaipur","Dharmanagar","Kailasahar","Belonia","Ambassa","Khowai","Teliamura","Santirbazar","Bishalgarh"]
  },
  "Uttar Pradesh": {
    districts: ["Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kushinagar","Lakhimpur Kheri","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Prayagraj","Raebareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"],
    cities: ["Lucknow","Kanpur","Ghaziabad","Agra","Meerut","Varanasi","Prayagraj","Bareilly","Aligarh","Moradabad","Saharanpur","Gorakhpur","Firozabad","Jhansi","Mathura","Shahjahanpur","Rampur","Muzaffarnagar","Lakhimpur","Hapur","Etawah","Mirzapur","Bulandshahr","Sambhal","Amroha","Hardoi","Azamgarh","Sitapur","Noida","Bahraich","Unnao"]
  },
  "Uttarakhand": {
    districts: ["Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"],
    cities: ["Dehradun","Haridwar","Roorkee","Haldwani","Rudrapur","Kashipur","Rishikesh","Kotdwar","Almora","Nainital","Mussoorie","Pithoragarh","Tehri","Champawat","Bageshwar","Uttarkashi"]
  },
  "West Bengal": {
    districts: ["Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling","Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman","Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"],
    cities: ["Kolkata","Asansol","Siliguri","Durgapur","Bardhaman","Malda","Baharampur","Kharagpur","Haldia","Darjeeling","Jalpaiguri","Cooch Behar","Howrah","Krishnanagar","Balurghat","Bankura","Purulia","Medinipur","Alipurduar","Raiganj","Kalimpong","Kurseong"]
  },
  "Andaman & Nicobar Islands": {
    districts: ["Nicobars","North & Middle Andaman","South Andaman"],
    cities: ["Port Blair","Diglipur","Rangat","Mayabunder","Campbell Bay","Car Nicobar"]
  },
  "Chandigarh": {
    districts: ["Chandigarh"],
    cities: ["Chandigarh","Mohali","Panchkula"]
  },
  "Dadra & Nagar Haveli and Daman & Diu": {
    districts: ["Dadra & Nagar Haveli","Daman","Diu"],
    cities: ["Daman","Diu","Silvassa"]
  },
  "Delhi": {
    districts: ["Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"],
    cities: ["New Delhi","Old Delhi","Noida","Dwarka","Rohini","Janakpuri","Laxmi Nagar","Saket","Connaught Place","Karol Bagh","Shahdara","Pitampura","Vasant Kunj","Greater Kailash","Vikaspuri","Uttam Nagar","Narela","Najafgarh"]
  },
  "Jammu & Kashmir": {
    districts: ["Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar","Kulgam","Kupwara","Poonch","Pulwama","Rajouri","Ramban","Reasi","Samba","Shopian","Srinagar","Udhampur"],
    cities: ["Srinagar","Jammu","Anantnag","Baramulla","Sopore","Kathua","Udhampur","Rajouri","Pulwama","Kupwara","Poonch","Doda","Kulgam","Kishtwar","Reasi","Ramban"]
  },
  "Ladakh": {
    districts: ["Kargil","Leh"],
    cities: ["Leh","Kargil","Nubra","Zanskar","Drass","Padum"]
  },
  "Lakshadweep": {
    districts: ["Lakshadweep"],
    cities: ["Kavaratti","Agatti","Amini","Andrott","Kalpeni","Minicoy","Kiltan"]
  },
  "Puducherry": {
    districts: ["Karaikal","Mahe","Puducherry","Yanam"],
    cities: ["Puducherry","Karaikal","Mahe","Yanam","Ozhukarai","Villianur","Ariyankuppam"]
  }
};

export const INDIA_STATES = Object.keys(INDIA_LOCATIONS).sort();

export function getDistricts(state: string): string[] {
  return (INDIA_LOCATIONS[state]?.districts ?? []).slice().sort();
}

export function getCities(state: string): string[] {
  return (INDIA_LOCATIONS[state]?.cities ?? []).slice().sort();
}
