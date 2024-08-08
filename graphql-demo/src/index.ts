import { gql, GraphQLClient } from "graphql-request";

const endpoint = `https://programs.shyft.to/v0/graphql/?api_key=`;

const graphQLClient = new GraphQLClient(endpoint, {
  method: `POST`,
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
});

function start() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("No command-line arguments provided.");
    return;
  }
  console.log("Command-line arguments:", args[0]);

  switch (args[0]) {
    case "all":
      queryAll();
      break;
    case "filter":
      queryAndFilter();
      break;
    case "sort":
      sortAndOrder();
      break;
    case "pagination":
      pagination();
      break;
    default: {
      console.log("Invalid arg");
      break;
    }
  }
}

function queryAll() {
  // Get all proposalsV2 accounts
  const query = gql`
    query GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw_ProposalV2 {
      GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw_ProposalV2 {
        name
        pubkey
      }
    }
  `;

  // @ts-ignore
  graphQLClient.request(query).then(console.log);
}

async function queryAndFilter() {


  let length = 50;
  let c = 0;
  let offset = 0;
  let allResults: any[] = [];
  let done = false;
  // Fetch data from the API
  while (length === 50 && !done) {
    const response = await fetch(`https://frontend-api.pump.fun/coins?offset=${offset}&limit=50&sortBy=desc&orderBy=latest`);
    await new Promise((r)=> setTimeout(r, 500))
    const results = await response.json();
    allResults = allResults.concat(results);
  
    length = results.length;
    c += length;
    offset += 50;
    for (const r of results){
      if (r.complete) {
        console.log(r)
        done = true;
      }
    }
    console.log(length, offset, c);
  }
  
  // Fetch data from GraphQL
  let allGraphQLResults: any[] = [];
  offset = 0;
  while (true) {
    const query = gql`
      query Pump_BondingCurve($orderBy: [pump_BondingCurve_order_by!], $where: pump_BondingCurve_bool_exp, $limit: Int, $offset: Int) {
        pump_BondingCurve(order_by: $orderBy, where: $where, limit: $limit, offset: $offset) {
          complete,
          pubkey,
          realTokenReserves
        }
      }
    `;
  
    const variables = {
      limit: 1000,
      offset,
      where: {
        complete: {
          _eq: false,
        },
      },
      orderBy: [{ realTokenReserves: 'asc' }],
    };
  
    // @ts-ignore
    const results = (await graphQLClient.request(query, variables)).pump_BondingCurve;
    allGraphQLResults = allGraphQLResults.concat(results);
    
  // Compare the data from API and GraphQL
  for (const apiResult of allResults) {
    const graphQLResult = allGraphQLResults.filter((item) => item.pubkey === apiResult.bonding_curve);
    if (graphQLResult) {
      console.log('Matching data:');
      console.log('API result:', apiResult);
      console.log('GraphQL result:', graphQLResult);
    } 
  }
    if (results.length < 1000) {
      break;
    }
  
    offset += 1000;
  }
  
}

function sortAndOrder() {
  // ProposalsV2 where governing mint is Grape token sorted by drafting date
  const query = gql`
    query GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw_ProposalV2(
      $where: GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw_ProposalV2_bool_exp
      $orderBy: [GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw_ProposalV2_order_by!]
    ) {
      GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw_ProposalV2(
        where: $where
        order_by: $orderBy
      ) {
        name
        pubkey
        draftAt
        governingTokenMint
      }
    }
  `;

  const variables = {
    where: {
      governingTokenMint: {
        _eq: "8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA",
      },
    },
    orderBy: [
      {
        draftAt: "desc",
      },
    ],
  };

  // @ts-ignore
  graphQLClient.request(query, variables).then(console.log);
}

function pagination() {
  //  Get the first 10 proposalsV2 accounts
  const query = gql`
    query GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw_ProposalV2(
      $limit: Int
      $offset: Int
    ) {
      GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw_ProposalV2(
        limit: $limit
        offset: $offset
      ) {
        name
        pubkey
      }
    }
  `;

  const variables = {
    limit: 10,
    offset: 0,
  };

  // @ts-ignore
  graphQLClient.request(query, variables).then(console.log);
}

start();
