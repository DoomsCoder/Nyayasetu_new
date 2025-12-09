import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

// Atrocity types with serial numbers
const atrocityOptions = [
    { id: 'inedible-substance', label: 'Putting inedible or dirty/obnoxious substance on a person (कसी व्यक्त को खाने योग्य नहीं या गंदा पदार्थ जबरदस्ती देना / लगाना)' },
    { id: 'excreta-dumping', label: 'Throwing/dumping excreta, sewage, carcass on someone (किसी पर मल-मूत्र, गंदा पानी या पशु-मृत शरीर फेंकना)' },
    { id: 'intentional-dumping', label: 'Dumping such substances intentionally to insult or annoy (अपमान या परेशान करने की नीयत से गंदगी डालना)' },
    { id: 'footwear-garland', label: 'Garlanding with footwear, parading naked or half-naked (चप्पल की माला पहनाना, नग्न या अर्ध-नग्न घुमाना)' },
    { id: 'forced-humiliation', label: 'Forcing to remove clothes, shave head, moustache or paint body (कपड़े उतरवाना, सिर/मूंछ जबरन मुंडवाना, शरीर पर रंग लगाना)' },
    { id: 'land-occupation', label: 'Wrongful occupation or illegal cultivation on land (ज़मीन पर गैर-कानूनी कब्ज़ा या खेती करना)' },
    { id: 'land-dispossession', label: 'Wrongful dispossession from land or interfering with forest rights (किसी को उसकी ज़मीन/जंगल के अधिकार से बेदखल करना)' },
    { id: 'forced-labour', label: 'Forced labour / begar / bonded labour (बेगार करवाना, जबरन या बंधुआ मज़दूरी करवाना)' },
    { id: 'forced-dead-body', label: 'Forcing to dispose or carry human/animal dead bodies (मानव/पशु शव उठाने या निपटाने के लिए मजबूर करना)' },
    { id: 'manual-scavenging', label: 'Forcing to do manual scavenging or employing for it (जबरन मैला ढोना करवाना या इसके लिए नियुक्त करना)' },
    { id: 'devadasi', label: 'Dedicating an SC/ST woman as a devadasi (किसी एससी/एसटी महिला को देवदासी बनाना)' },
    { id: 'voting-prevention', label: 'Preventing from voting or filing nomination (मतदान या नामांकन करने से रोकना)' },
    { id: 'panchayat-threat', label: 'Stopping or threatening a Panchayat/Municipal office holder (पंचायत/नगरपालिका अधिकारी को काम करने से रोकना या धमकाना)' },
    { id: 'post-election-violence', label: 'Violence after elections or social/economic boycott (चुनाव के बाद हिंसा करना या सामाजिक/आर्थिक बहिष्कार करना)' },
    { id: 'voting-retaliation', label: 'Committing any offence because a person voted/did not vote (किसी ने वोट दिया या नहीं दिया — इस कारण अपराध करना)' },
    { id: 'false-cases', label: 'Filing false, malicious legal cases against SC/ST person (एससी/एसटी व्यक्ति पर झूठे या बदनीयत कानूनी मामले दर्ज करना)' },
    { id: 'false-information', label: 'Giving false information to a public servant (सरकारी अधिकारी को झूठी/गलत जानकारी देना)' },
    { id: 'public-insult', label: 'Intentional insult in public view (सार्वजनिक स्थान पर जानबूझकर अपमान करना)' },
    { id: 'caste-abuse', label: 'Abusing by caste name in public (सार्वजनिक स्थान पर जाति-सूचक गाली देना)' },
    { id: 'sacred-damage', label: 'Destroying/damaging sacred or respected objects (पवित्र या सम्मानित वस्तुओं को नुकसान पहुँचाना)' },
    { id: 'caste-hatred', label: 'Promoting caste-hatred or enmity (जातीय नफरत या वैमनस्य फैलाना)' },
    { id: 'dead-disrespect', label: 'Disrespecting respected dead person by words/acts (किसी दिवंगत सम्मानित व्यक्ति का अपमान करना)' },
    { id: 'sexual-touching', label: 'Sexual touching/gesture without consent of SC/ST woman (एससी/एसटी महिला को बिना सहमति यौन रूप से छूना या संकेत करना)' },
    { id: 'acid-attack', label: 'Throwing or attempt to throw acid (तेज़ाब फेंकना या फेंकने का प्रयास करना)' },
    { id: 'outraging-modesty', label: 'Outraging modesty of woman (महिला की मर्यादा भंग करना)' },
    { id: 'sexual-harassment', label: 'Sexual harassment (यौन उत्पीड़न)' },
    { id: 'disrobe-intent', label: 'Intent to disrobe a woman (महिला के कपड़े उतारने की नीयत से हमला करना)' },
    { id: 'voyeurism', label: 'Voyeurism (चोरी-छिपे देखना या वीडियो बनाना)' },
    { id: 'stalking', label: 'Stalking (पीछा करना या परेशान करना)' },
    { id: 'marital-rape-separation', label: 'Sexual intercourse by husband during separation (अलग रहने की अवधि में पति द्वारा जबरन शारीरिक संबंध बनाना)' },
    { id: 'authority-abuse', label: 'Sexual intercourse by person in authority (अधिकार में बैठे व्यक्ति द्वारा यौन शोषण)' },
    { id: 'modesty-insult', label: 'Insulting modesty of woman by word/gesture (महिला की मर्यादा का शब्द/इशारे से अपमान करना)' },
    { id: 'water-contamination', label: 'Fouling or contaminating water (पानी को गंदा या दूषित करना)' },
    { id: 'passage-denial', label: 'Denying right of passage to public place (सार्वजनिक मार्ग/रास्ते का उपयोग रोकना)' },
    { id: 'forced-eviction', label: 'Forcing a person to leave house/village (किसी व्यक्ति को घर या गांव छोड़ने के लिए मजबूर करना)' },
    { id: 'public-resource-denial', label: 'Preventing SC/ST person from using public resources (सार्वजनिक पानी, सड़क, मंदिर, वाहन, कपड़े आदि के उपयोग से रोकना)' },
    { id: 'witch-torture', label: 'Physical/mental torture by calling woman "witch" (महिला को "डायन/चुड़ैल" कहकर शारीरिक/मानसिक यातना देना)' },
    { id: 'social-boycott', label: 'Imposing or threatening social/economic boycott (सामाजिक या आर्थिक बहिष्कार करना/धमकाना)' },
    { id: 'false-evidence', label: 'Giving or fabricating false evidence (झूठे साक्ष्य देना या तैयार करना)' },
    { id: 'ipc-10-years', label: 'Committing IPC offences punishable with 10+ years (10 वर्ष या अधिक दंड वाली गंभीर IPC धाराओं का अपराध करना)' },
    { id: 'poa-ipc-schedule', label: 'Offences under IPC Schedule of PoA Act (PoA अधिनियम सूची में शामिल IPC अपराध करना)' },
    { id: 'public-servant-abuse', label: 'Victimization by a public servant (सरकारी कर्मचारी द्वारा प्रताड़ित करना)' },
    { id: 'disability-caused', label: 'Disability caused due to offence (अपराध के कारण विकलांगता होना)' },
    { id: 'rape-gang-rape', label: 'Rape / Gang-rape (बलात्कार / सामूहिक बलात्कार)' },
    { id: 'murder-death', label: 'Murder or death (हत्या या मृत्यु होना)' },
    { id: 'major-offence-relief', label: 'Additional relief for major offences (हत्या, बलात्कार जैसे गंभीर अपराधों पर अतिरिक्त सहायता)' },
    { id: 'house-destruction', label: 'Complete destruction or burning of house (घर का जलना या पूरी तरह नष्ट होना)' },
];

const SearchableAtrocitySelect = ({ value, onChange, required = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Filter options based on search term
    const filteredOptions = atrocityOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Get selected option label
    const selectedOption = atrocityOptions.find(opt => opt.id === value);
    const selectedIndex = atrocityOptions.findIndex(opt => opt.id === value);

    const handleSelect = (optionId) => {
        onChange(optionId);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-10 px-3 rounded-md border border-input bg-background text-left flex items-center justify-between hover:border-primary/50 transition-colors ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
            >
                <span className={`truncate ${!value ? 'text-muted-foreground' : ''}`}>
                    {value ? `${selectedIndex + 1}. ${selectedOption?.label?.split('(')[0]?.trim()}` : 'Select type of atrocity'}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Hidden input for form validation */}
            <input
                type="hidden"
                id="atrocity-type"
                name="atrocity-type"
                value={value}
                required={required}
            />

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-50 max-h-[400px] overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-input">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search atrocity type..."
                                className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto max-h-[320px]">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                No matching atrocity types found
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const originalIndex = atrocityOptions.findIndex(opt => opt.id === option.id);
                                const isSelected = value === option.id;

                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => handleSelect(option.id)}
                                        className={`w-full px-3 py-2.5 text-left text-sm hover:bg-accent/10 flex items-start gap-2 transition-colors ${isSelected ? 'bg-primary/10 text-primary' : ''}`}
                                    >
                                        <span className="font-semibold text-primary min-w-[28px] flex-shrink-0">
                                            {originalIndex + 1}.
                                        </span>
                                        <span className="flex-1 leading-relaxed">
                                            {option.label}
                                        </span>
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableAtrocitySelect;
