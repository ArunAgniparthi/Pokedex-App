import { writable } from "svelte/store";
import { GraphQLClient, gql } from "graphql-request";

// Initialize favorites from localStorage, fallback to empty array
const stored = typeof localStorage !== "undefined"? JSON.parse(localStorage.getItem("x") || "[]") : [];
export const favorites = writable <number[]> (stored);

// Sync store with localStorage whenever it changes
favorites.subscribe((value) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("x", JSON.stringify(value));
  }
});

// GraphQL Client
const client = new GraphQLClient("https://beta.pokeapi.co/graphql/v1beta");
// Fetch Pokemon Dataset using GraphQL
    export async function fetchPokemons() {
          const query = gql`
            query {
              pokemon_v2_pokemon(limit: 1000) {
                id
                name
                pokemon_v2_pokemontypes {
                  pokemon_v2_type { name }
                }
                pokemon_v2_pokemonabilities {
                  pokemon_v2_ability { name }
                }
                pokemon_v2_pokemonstats {
                  base_stat
                  pokemon_v2_stat { name }
                }
              }
            }
          `;
          const data:any = await client.request(query);
          return data.pokemon_v2_pokemon.map((p: any) => ({
            id: p.id,
            name: p.name,
            sprites: {
              front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
            },
            types: p.pokemon_v2_pokemontypes.map((t: any) => t.pokemon_v2_type.name) ,
            
            abilities: p.pokemon_v2_pokemonabilities.map((a: any) =>a.pokemon_v2_ability.name),
            stats: p.pokemon_v2_pokemonstats.map((s: any) => ({
              name: s.pokemon_v2_stat.name,
              base_stat: s.base_stat
            }))
          }));
    }
    // Fetch Favorites
    export async function fetchFavorites(ids:number[]) {
      if (ids.length === 0) return [];
      const query = gql`
        query GetFavs($ids: [Int!]) {
          pokemon_v2_pokemon(where: { id: { _in: $ids } }) {
            id
            name
            pokemon_v2_pokemontypes {
              pokemon_v2_type { name }
            }
          }
        }
      `;
      const data: any = await client.request(query, {ids});
      return data.pokemon_v2_pokemon.map((p: any) => ({
        id: p.id,
        name: p.name,
        sprites: {
          front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
        },
        types: p.pokemon_v2_pokemontypes.map((t: any) => ({ name: t.pokemon_v2_type.name }))
      }));
  }