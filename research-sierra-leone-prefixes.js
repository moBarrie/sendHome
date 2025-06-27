#!/usr/bin/env node

// Research script to find all Sierra Leone mobile prefixes
console.log("🔍 Researching Sierra Leone Mobile Network Prefixes");
console.log("=".repeat(60));

// Known Sierra Leone mobile networks and their prefixes
const SIERRA_LEONE_RESEARCH = {
  // Country code: +232

  // AFRICELL (Major network)
  AFRICELL: {
    network: "Africell",
    prefixes: ["76", "77", "88"],
    notes: "Major mobile network operator",
  },

  // AIRTEL (Major network)
  AIRTEL: {
    network: "Airtel",
    prefixes: ["70", "72", "73", "74", "75", "78", "79"],
    notes: "Major mobile network operator",
  },

  // ORANGE (Major network)
  ORANGE: {
    network: "Orange",
    prefixes: ["30", "31", "32", "33", "34", "35", "36", "37", "38", "39"],
    notes: "Major mobile network operator",
  },

  // QCELL (Newer network)
  QCELL: {
    network: "QCell",
    prefixes: ["25", "26", "27", "28", "29", "95", "96", "97", "98", "99"],
    notes: "Newer mobile network operator",
  },

  // SMART (if still active)
  SMART: {
    network: "Smart",
    prefixes: ["40", "41", "42", "43", "44", "45", "46", "47", "48", "49"],
    notes: "May not be active anymore",
  },
};

console.log("📱 Sierra Leone Mobile Networks Overview:");
console.log("");

// Display all networks and prefixes
Object.values(SIERRA_LEONE_RESEARCH).forEach((network) => {
  console.log(`🏢 ${network.network}`);
  console.log(`   Prefixes: ${network.prefixes.join(", ")}`);
  console.log(`   Notes: ${network.notes}`);
  console.log("");
});

// Create comprehensive list
const ALL_PREFIXES = [];
Object.values(SIERRA_LEONE_RESEARCH).forEach((network) => {
  network.prefixes.forEach((prefix) => {
    ALL_PREFIXES.push({
      prefix,
      network: network.network,
      format: `+232${prefix}XXXXXX`,
    });
  });
});

console.log("📋 Complete Prefix List:");
console.log("");
ALL_PREFIXES.sort((a, b) => parseInt(a.prefix) - parseInt(b.prefix)).forEach(
  (item) => {
    console.log(`${item.prefix} - ${item.network} (${item.format})`);
  }
);

console.log("");
console.log(`📊 Total prefixes found: ${ALL_PREFIXES.length}`);
console.log("");

// Generate test cases for Monime
console.log("🧪 Test Numbers for Monime API:");
console.log("");

const TEST_NUMBERS = [
  { prefix: "25", network: "QCell", number: "+23225123456" },
  { prefix: "30", network: "Orange", number: "+23230123456" },
  { prefix: "70", network: "Airtel", number: "+23270123456" },
  { prefix: "72", network: "Airtel", number: "+23272123456" },
  { prefix: "73", network: "Airtel", number: "+23273123456" },
  { prefix: "74", network: "Airtel", number: "+23274123456" },
  { prefix: "75", network: "Airtel", number: "+23275123456" },
  { prefix: "76", network: "Africell", number: "+23276123456" },
  { prefix: "77", network: "Africell", number: "+23277123456" },
  { prefix: "78", network: "Airtel", number: "+23278123456" },
  { prefix: "79", network: "Airtel", number: "+23279123456" },
  { prefix: "88", network: "Africell", number: "+23288123456" },
  { prefix: "95", network: "QCell", number: "+23295123456" },
  { prefix: "99", network: "QCell", number: "+23299123456" },
];

TEST_NUMBERS.forEach((test) => {
  console.log(`${test.prefix} (${test.network}): ${test.number}`);
});

console.log("");
console.log("💡 Next Steps:");
console.log("1. Test these prefixes with Monime API using provider code m17");
console.log("2. Update sierra-leone-networks.js with all prefixes");
console.log("3. Mark working prefixes based on test results");
console.log("4. Ensure phone validation supports all active networks");
