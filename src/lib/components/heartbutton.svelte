<script lang="ts">
	import { favorites } from "$lib/stores/favorites";

    export let pokemonId: number;
    function handleFavorite(e:MouseEvent){
        e.stopPropagation();
        favorites.update((list)=>{
            if(list.includes(pokemonId)){
                return list.filter((id)=>id!==pokemonId);
            }else{
                return [...list,pokemonId];
            }
        });
    }
</script>

<button class="absolute bottom-2 right-2 text-3xl" on:click={handleFavorite}>
    <span class={$favorites.includes(pokemonId)? "text-red-500": "text-white"}>&hearts;</span>
</button>