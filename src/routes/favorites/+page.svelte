<script lang="ts">
  import { favorites } from "$lib/stores/favorites";
  import { get } from "svelte/store";
  import { GraphQLClient, gql } from "graphql-request";
  import { onMount } from "svelte";

  let favPokemons: any[] = [];
  let loading = true;
  let error: string | null = null;

  const client = new GraphQLClient("https://beta.pokeapi.co/graphql/v1beta");

  async function fetchFavorites() {
    loading = true;
    error = null;

    try {
      const favIds = get(favorites); // current list of IDs
      if (favIds.length === 0) {
        favPokemons = [];
        return;
      }

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

      const data: any = await client.request(query, { ids: favIds });

      favPokemons = data.pokemon_v2_pokemon.map((p: any) => ({
        id: p.id,
        name: p.name,
        sprites: {
          front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
        },
        types: p.pokemon_v2_pokemontypes.map((t: any) => ({ name: t.pokemon_v2_type.name }))
      }));
    } catch (err: any) {
      console.error(err);
      error = "Failed to load favorites";
    } finally {
      loading = false;
    }
  }

  // Remove from favorites
  function toggleFavorite(pokemonId: number) {
    favorites.update((list) => {
      if (list.includes(pokemonId)) {
        return list.filter((id) => id !== pokemonId);
      } else {
        return [...list, pokemonId];
      }
    });

    // Re-fetch remaining favorites
    fetchFavorites();
  }

  onMount(() => {
    fetchFavorites();
    const unsubscribe = favorites.subscribe(() => {
      fetchFavorites();
    });

    return () => unsubscribe();
  });
</script>
<nav class="flex justify-between items-center px-6 py-7 w-full bg-black text-white">
    <h1 class="font-extrabold">POKEDEX</h1>
    <div class="flex items-center space-x-2">
        <a href="/dashboard" class="hover:text-yellow-300 text-medium">Pokemons</a>
    </div>
</nav>
<div class="pt-10 px-6 min-h-screen bg-gray-100">
  <h1 class="text-2xl font-bold mb-6">Your Favourites</h1>

  {#if loading}
    <p>Loading favorites...</p>
  {:else if error}
    <p class="text-red-500">{error}</p>
  {:else if favPokemons.length === 0}
    <p class="text-gray-600">No favorites yet. Go back and Like some Pokemon</p>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {#each favPokemons as p}
        <div class="relative bg-black/60 text-white p-4 rounded-xl shadow-lg flex flex-col items-center hover:scale-105 transition">
          <img src={p.sprites.front_default} alt={p.name} class="w-20 h-20 mb-2" />
          <h2 class="capitalize font-bold">{p.name}</h2>
          <div class="flex space-x-2 mt-1">
            {#each p.types as t}
              <span class="px-2 py-0.5 rounded-full text-xs bg-yellow-400 text-black">{t.name}</span>
            {/each}
          </div>

          <!-- Heart Button -->
          <button
            class="absolute bottom-2 right-2 text-2xl"
            on:click={() => toggleFavorite(p.id)}
          >
            <span class={$favorites.includes(p.id) ? "text-red-500" : "text-gray-400"}>&hearts;</span>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>