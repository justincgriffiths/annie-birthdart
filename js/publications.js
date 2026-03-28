// publications.js -- Publication data + DOM render
// Self-contained: writes to #pub-list, no exports needed
(function() {
    /* Publication data: [year, journal, title, pmid] */
    const P = [
        [2026,"JAMA Netw Open","Tropical Cyclone Exposure and Psychoactive Drug-Related Death Rates",41719042],
        [2026,"Environ Res","Drinking water arsenic, urinary arsenic biomarkers, and cognitive impairment in the REGARDS study",41534586],
        [2026,"J Expo Sci Environ Epidemiol","Public drinking water contaminant estimates for birth cohorts in the ECHO Cohort",39098852],
        [2025,"JAMA Netw Open","Public Water Arsenic and Birth Outcomes in the ECHO Cohort",40522663],
        [2025,"Environ Health Perspect","The Association of Arsenic Exposure and Metabolism Biomarkers with Subclinical Measures of Liver Disease",40493026],
        [2025,"Environ Health Perspect","The Association of Blood Lead with Cardiovascular Disease Incidence and Mortality: Strong Heart Study",40471206],
        [2025,"Prev Chronic Dis","Uranium Exposure, Hypertension, and Blood Pressure in the Strong Heart Family Study",40272946],
        [2025,"Environ Res","Uranium exposure and kidney tubule biomarkers in MESA",39922262],
        [2025,"Nature Medicine","Large floods drive changes in cause-specific mortality in the United States",39753964],
        [2025,"Environ Int","Private, public, and bottled drinking water: Shared contaminant-mixture exposures and effects challenge",39736175],
        [2025,"J Expo Sci Environ Epidemiol","Geographic and dietary differences of urinary uranium levels in the Strong Heart Family Study",38961273],
        [2024,"JACC Adv","Relationship Between Urinary Uranium and Cardiac Geometry and Left Ventricular Function: Strong Heart Study",39640231],
        [2024,"J Am Coll Cardiol","Urinary Metal Levels and Coronary Artery Calcification: MESA",39297845],
        [2024,"Environ Res","Arsenic speciation analysis in human urine for long term epidemiological studies: MESA",39179143],
        [2024,"Environ Health Perspect","Invited Perspective: The All About Arsenic Program\u2014A Blueprint for Leveraging Youth Engagement to Advance Water Justice",39166866],
        [2024,"Circulation","Association of Urinary Metals With Cardiovascular Disease Incidence and All-Cause Mortality in MESA",39087344],
        [2024,"Circ Res","Proteomics, Human Environmental Exposure, and Cardiometabolic Risk",38662804],
        [2024,"Diabetes Care","Association of Water Arsenic With Incident Diabetes in U.S. Adults: MESA and Strong Heart Study",38656975],
        [2024,"Nature Sustainability","Hazardous heat exposure among incarcerated people in the United States",41727418],
        [2024,"J Am Heart Assoc","The Contribution of Declines in Blood Lead Levels to Reductions in Blood Pressure Levels: Strong Heart Family Study",38205795],
        [2024,"J Expo Sci Environ Epidemiol","US drinking water quality: exposure risk profiles for seven legacy and emerging contaminants",37739995],
        [2024,"J Expo Sci Environ Epidemiol","Contribution of arsenic and uranium in private wells and community water systems to urinary biomarkers in US adults",37558699],
        [2024,"J Expo Sci Environ Epidemiol","Regional and racial/ethnic inequalities in public drinking water fluoride concentrations across the US",37391608],
        [2023,"Environ Health Perspect","Blood and Urinary Metal Levels among Exclusive Marijuana Users in NHANES (2005-2018)",37646523],
        [2023,"Environ Health Perspect","Geospatial Assessment of Racial/Ethnic Composition, Social Vulnerability, and Lead Water Service Lines in New York City",37646509],
        [2023,"Environ Res","Associations between area-level arsenic exposure and adverse birth outcomes: An ECHO-wide cohort analysis",37517496],
        [2023,"Environ Pollut","Impact of lowering the US maximum contaminant level on arsenic exposure",37331581],
        [2023,"Environ Res","Cross-sectional associations between drinking water arsenic and urinary inorganic arsenic: NHANES 2003-2014",36963713],
        [2022,"Nature Communications","Nationwide geospatial analysis of county racial and ethnic composition and public drinking water arsenic and uranium",36460659],
        [2022,"Environ Pollut","Socioeconomic vulnerability and public water arsenic concentrations across the US",36084737],
        [2022,"Environ Res","Blood cadmium, lead, manganese, mercury, and selenium levels in American Indian populations: Strong Heart Study",35977585],
        [2022,"Environ Int","A mass-balance approach to evaluate arsenic intake and excretion in different populations",35809487],
        [2022,"Environ Res","Association of blood manganese, selenium with steatosis, fibrosis in NHANES 2017-18",35691383],
        [2022,"Lancet Planetary Health","Sociodemographic inequalities in uranium and other metals in community water systems across the USA, 2006-11",35397220],
        [2022,"Antioxid Redox Signal","High Level of Selenium Exposure in the Strong Heart Study: A Cause for Incident Cardiovascular Disease?",35350849],
        [2021,"J Am Soc Nephrol","Racial Inequalities in Drinking Water Lead Exposure: A Wake-Up Call",34544822],
        [2021,"Environ Res","Urinary arsenic and heart disease mortality in NHANES 2003-2014",34090890],
        [2021,"Sci Total Environ","Associations between private well water and community water supply arsenic concentrations in the conterminous United States",33991916],
        [2020,"Environ Health Perspect","Inequalities in Public Water Arsenic Concentrations in Counties and Community Water Systems across the US, 2006-2011",33295795],
        [2020,"Proc Natl Acad Sci USA","Environmental racism and the need for private well protections",32641505],
        [2020,"Int J Environ Res Public Health","Urinary Metal Levels after Repeated Edetate Disodium Infusions: Preliminary Findings",32610666],
        [2020,"Environ Res","Arsenic in US correctional facility drinking water, 2006-2011",32585331],
        [2020,"Chemosphere","A survey of trace metal burdens in increment cores from eastern cottonwood across a childhood cancer cluster, Ohio",31425869],
        [2019,"Environ Res","Dietary determinants of inorganic arsenic exposure in the Strong Heart Family Study",31442790],
        [2018,"Environ Health Perspect","Opportunities and Challenges for Dietary Arsenic Intervention",30235424],
        [2018,"Environ Res","Urinary tungsten and incident cardiovascular disease in the Strong Heart Study",29940477],
        [2017,"Lancet Public Health","The effect of the Environmental Protection Agency maximum contaminant level on arsenic exposure in the USA from 2003 to 2014",29250608],
        [2017,"Sci Total Environ","Mitigating dietary arsenic exposure: Current status in the United States and recommendations for an improved path forward",28065543],
        [2017,"Environ Health Perspect","Poultry Consumption and Arsenic Exposure in the U.S. Population",27735790],
        [2017,"Environ Health Perspect","Nitarsone, Inorganic Arsenic, and Other Arsenic Species in Turkey Meat: Exposure and Risk Assessment",27735789],
        [2016,"Curr Environ Health Rep","Environmental Metals and Cardiovascular Disease in Adults: A Systematic Review Beyond Lead and Cadmium",27783356]
    ];

    function renderPubs() {
        const el = document.getElementById('pub-list');
        if (!el) return;
        let yr = 0, h = '';
        P.forEach(([y, j, t, p]) => {
            if (y !== yr) { yr = y; h += '<div class="pub-year">' + y + '</div>'; }
            h += '<a href="https://pubmed.ncbi.nlm.nih.gov/' + p + '/" target="_blank" rel="noopener" class="pub-item">'
               + '<span class="pub-title">' + t + '</span>'
               + '<span class="pub-journal">' + j + '</span></a>';
        });
        el.innerHTML = h;
    }

    renderPubs();
})();
