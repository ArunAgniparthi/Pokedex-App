<script lang="ts">
  import { favorites,fetchFavorites } from "$lib/stores/favorites";
  import Heartbutton from "$lib/components/heartbutton.svelte";


  let favPokemons= $state<any[]>([]);
  let loading = $state(true);
  let error= $state<string|null>(null);

  // Handle Favorites
  async function handleFetchFavorites() {
    loading=true;
    error=null;
    try {
      const favIds= $favorites;
      favPokemons=await fetchFavorites(favIds);
    } catch (err:any) {
      console.error("Failed to fetch Favorites",err);
      error="Failed to fetch Favorites";
    }finally{
      loading=false;
    }
  }

  $effect(() => {
    handleFetchFavorites();
    const unsubscribe = favorites.subscribe(() => {
      handleFetchFavorites();
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
          <Heartbutton pokemonId={p.id}/>
        </div>
      {/each}
    </div>
  {/if}
</div>