import { useEffect } from "react"

function Home() {
    return (
        <>
            {/* HERO SECTION */}
            <div>
                <section
                    className="
                        min-h-screen
                        flex items-center
                        py-16 md:py-24
                    "
                >
                    <div
                        className="
                            container mx-auto px-4 sm:px-6 lg:px-8
                            text-center
                            max-w-5xl
                        "
                    >
                        <p
                            className="
                                text-purple-200
                                font-bold
                                text-lg sm:text-xl md:text-2xl
                                leading-snug md:leading-snug
                            "
                        >
                            COMPARING PLAYERS MADE EASY
                        </p>

                        <h1
                            className="
                                text-red-200
                                font-bold
                                mt-2
                                text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl
                                leading-tight md:leading-tight
                                tracking-tight
                            "
                        >
                            CRUNCH TIME
                        </h1>

                        <p
                            className="
                                font-bold
                                mt-3 md:mt-4
                                text-base sm:text-xl md:text-2xl
                                leading-relaxed md:leading-relaxed
                                text-gray-300
                            "
                        >
                            The ultimate player comparison tool for football fanatics. Compare players using stats to see who truly stands out on the field.
                        </p>

                        <div className="mt-6 md:mt-10">
                            <button
                                className="
                                    inline-flex items-center justify-center
                                    rounded-full
                                    text-white
                                    font-semibold
                                    px-6 sm:px-8 md:px-10
                                    py-2.5 sm:py-3 md:py-4
                                    text-base sm:text-lg md:text-xl
                                    transition
                                    shadow-md
                                    bg-gradient-to-r from-purple-600 via-blue-500 to-red-500
                                    animate-gradient-x
                                    hover:scale-105 hover:shadow-lg active:scale-95"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}

export default Home