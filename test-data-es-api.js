// Script pour tester l'API Data ES directement
// Usage: node test-data-es-api.js

const DATA_ES_BASE_URL = 'https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records';

async function testDataESAPI() {
  console.log('🧪 Test de l\'API Data ES...\n');
  
  // Test 1: Football
  console.log('⚽ Test Football:');
  await testSport('football');
  
  // Test 2: Basketball
  console.log('\n🏀 Test Basketball:');
  await testSport('basketball');
  
  // Test 3: Tennis
  console.log('\n🎾 Test Tennis:');
  await testSport('tennis');
  
  // Test 4: Running
  console.log('\n🏃 Test Running:');
  await testSport('running');
  
  // Test 5: Swimming
  console.log('\n🏊 Test Swimming:');
  await testSport('swimming');
  
  // Test 6: Volleyball
  console.log('\n🏐 Test Volleyball:');
  await testSport('volleyball');
  
  // Test 7: Cycling
  console.log('\n🚴 Test Cycling:');
  await testSport('cycling');
}

async function testSport(sport) {
  try {
    const url = new URL(DATA_ES_BASE_URL);
    url.searchParams.set('limit', '10');
    url.searchParams.set('select', 'equip_nom,equip_type_name,new_name,dep_code,equip_coordonnees,equip_prop_type,inst_nom,inst_adresse');
    
    // Filtres
    const whereConditions = [];
    whereConditions.push(`(equip_prop_type='Commune' OR equip_prop_type='Collectivité territoriale' OR equip_prop_type='Etat' OR equip_prop_type='Région')`);
    
    // Mapping des sports
    let sportFilter = '';
    switch (sport.toLowerCase()) {
      case 'football':
        sportFilter = `equip_type_name LIKE '%Football%' OR equip_type_name LIKE '%Soccer%'`;
        break;
      case 'basketball':
        sportFilter = `equip_type_name LIKE '%Basketball%' OR equip_type_name LIKE '%Basket%'`;
        break;
      case 'tennis':
        sportFilter = `equip_type_name LIKE '%Tennis%'`;
        break;
      case 'running':
        sportFilter = `equip_type_name LIKE '%Athlétisme%' OR equip_type_name LIKE '%Piste%' OR equip_type_name LIKE '%Course%'`;
        break;
      case 'cycling':
        sportFilter = `equip_type_name LIKE '%Vélo%' OR equip_type_name LIKE '%Cycling%' OR equip_type_name LIKE '%Piste cyclable%'`;
        break;
      case 'volleyball':
        sportFilter = `equip_type_name LIKE '%Volleyball%' OR equip_type_name LIKE '%Volley%'`;
        break;
      case 'swimming':
        sportFilter = `equip_type_name LIKE '%Natation%' OR equip_type_name LIKE '%Piscine%' OR equip_type_name LIKE '%Swimming%'`;
        break;
      default:
        sportFilter = `equip_type_name IS NOT NULL`;
    }
    
    whereConditions.push(sportFilter);
    url.searchParams.set('where', whereConditions.join(' AND '));
    
    console.log(`URL: ${url.toString()}`);
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    console.log(`✅ ${data.records?.length || 0} équipements trouvés`);
    
    if (data.records && data.records.length > 0) {
      console.log('Exemples:');
      data.records.slice(0, 3).forEach((record, index) => {
        const fields = record.fields || record;
        console.log(`  ${index + 1}. ${fields.equip_nom || fields.nom} (${fields.equip_type_name || fields.type})`);
        console.log(`     📍 ${fields.new_name || fields.commune}, ${fields.dep_code || fields.departement}`);
        if (fields.equip_coordonnees) {
          console.log(`     🗺️  ${fields.equip_coordonnees.lat}, ${fields.equip_coordonnees.lon}`);
        }
      });
    }
    
  } catch (error) {
    console.error(`❌ Erreur pour ${sport}:`, error.message);
  }
}

// Exécuter le test
testDataESAPI().catch(console.error); 