import { gql, GraphQLClient } from 'graphql-request';

// SpaceX API
export const endpoint = 'https://api.spacex.land/graphql/';

// TODO basic caching based on the requested parameters and endpoint
//   because the reference caching as apollo does is to complex (for now)
// https://logaretm.com/blog/2020-02-24-caching-graphql-requests/

const graphQLClient = new GraphQLClient(endpoint);

const query = gql`
  query GetLaunches {
    launchesPast(limit: 10) {
      id
      mission_name
      launch_date_local
      launch_site {
        site_name_long
      }
      links {
        article_link
        video_link
      }
      rocket {
        rocket_name
      }
    }
  }
`;

export const fetchLaunches = async () => {
  const data = await graphQLClient.request(query);
  console.log('Custom', data);
};
