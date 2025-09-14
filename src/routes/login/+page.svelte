<script lang="ts">
    import {auth, googleProvider} from "$lib/firebase";
    import {signInWithEmailAndPassword,signInWithPopup,sendPasswordResetEmail} from "firebase/auth";
    import {goto} from "$app/navigation";

    let email="";
    let password="";
    let errorMessage="";
    let successMessage="";

    // Signin with mail & password
    async function handlemaillogin(e:Event) {
        e.preventDefault();
        errorMessage="";
        try {
            const userCredential=await signInWithEmailAndPassword(auth,email,password);
            console.log("Signin successful",userCredential.user);
            goto("/dashboard");
        } catch (error:any) {
            errorMessage=error.message;
            console.error("Failed",error);
        }
    }
    // SignIn with Google
    async function handleGoogleSignin() {
        errorMessage="";
        try {
            const result=await signInWithPopup(auth,googleProvider);
            console.log("Signin successful",result.user);
            goto("/dashboard");
        } catch (error:any) {
            errorMessage=error.message;
            console.log("Failed",error);
        }
    }
    //Forgot Password
    async function handleForgotPass() {
        if(!email){
            errorMessage="Please enter mail first"
            return;
        }
        try {
            await sendPasswordResetEmail(auth,email);
            successMessage="Password reset mail sent. Please check your mail"
        } catch (error:any) {
            errorMessage=error.message;
        }   
    }
</script>

<nav class="flex justify-between items-center px-6 py-3 absolute top-0 left-0 bg-black w-full text-white">
    <h2 class="font-extrabold text-xl">POKEDEX</h2>
    <div class="space-x-6">
        <a href="/" class="hover:yello-300 ">Home</a>
        <a href="/signup" class="hover:yello-300 ">Sign Up</a>
    </div>
</nav>
<div class="flex justify-center bg-cover bg-center items-center min-h-screen" style="background-image: url('https://images8.alphacoders.com/134/1349281.png');">
    <div class="bg-white/50 border rounded-xl p-8 max-w-lg w-full">
        <h1 class="text-2xl text-center font-bold mb-6">Login</h1>
        <form class="space-y-4" on:submit={handlemaillogin}>
            <input
            type="email"
            placeholder="Email"
            bind:value={email}
            class="w-full rounded-xl"
            />
            <input
            type="password"
            placeholder="Password"
            bind:value={password}
            class="w-full rounded-xl"
            />
            <button  class="w-full border rounded-xl hover:bg-green-500 py-2">Login In</button>
        </form>

        <p class="mt-3 font-medium text-center">or</p>

        <button class="w-full border rounded-xl hover:bg-gray-500 bg-blue-300 py-2 mt-3" on:click={handleGoogleSignin}>SignIn with Google</button>

        <button class="mt-3 text-blue-500 text-md hover:underline" on:click={handleForgotPass}>Forgot Password?</button>

        {#if successMessage}
        <p class="text-center text-green-600 text-medium">{successMessage}</p>
        {/if}

        {#if errorMessage}
        <p class="text-center text-red-600 text-medium">{errorMessage}</p>
        {/if}

        <p class="mt-3 test-start">You dont an have account?
            <a href="/signup" class="text-red-500 hover:underline">SignUp</a>
        </p>
    </div>
</div>
