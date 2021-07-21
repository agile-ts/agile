import { gql, ApolloClient, InMemoryCache } from '@apollo/client';
import { endpoint } from './index';

const client = new ApolloClient({
  uri: endpoint,
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

const query = gql`
  query GetLaunches {
    launchesPast(limit: 10) {
      id
      mission_name
      rocket {
        rocket_name
        rocket {
          id
          height {
            feet
          }
        }
      }
    }
  }
`;

const query2 = gql`
  query GetLaunches {
    launches(limit: 5) {
      id
      launch_year
      mission_id
    }
  }
`;

export const fetchLaunchesWithApollo = async () => {
  const response = await client.query({
    // @ts-ignore
    query,
  });

  const response2 = await client.query({
    // @ts-ignore
    query: query2,
  });

  console.log('Apollo', client, response.data, response2.data);
};
