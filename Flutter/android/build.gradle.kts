allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.layout.buildDirectory.value(rootProject.layout.projectDirectory.dir("../build"))

subprojects {
    val newSubprojectBuildDir = rootProject.layout.buildDirectory.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

subprojects {
    project.evaluationDependsOn(":app")
}

subprojects {
    val fixNamespace = {
        if (project.hasProperty("android")) {
            val android = project.extensions.getByName("android")
            try {
                val namespaceMethod = android.javaClass.getMethod("setNamespace", String::class.java)
                val getNamespaceMethod = android.javaClass.getMethod("getNamespace")
                if (getNamespaceMethod.invoke(android) == null) {
                    val name = project.name
                    val packageName = when (name) {
                        "uni_links" -> "name.avioli.unilinks"
                        else -> "com.sportsphere.${name.replace("-", "_")}"
                    }
                    namespaceMethod.invoke(android, packageName)
                }
            } catch (e: Exception) {
            }
        }
    }
    if (project.state.executed) {
        fixNamespace()
    } else {
        project.afterEvaluate { fixNamespace() }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}