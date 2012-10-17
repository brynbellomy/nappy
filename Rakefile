task :default => [ :uninstall, :clean, :build, :install ]

pwd = Dir.pwd

directory "bin"
directory "lib"
directory "/usr/local/bin"

file "node_modules"                                          do |t| sh "npm install" end
file "lib/node-api.js" => [ "lib" ]                          do |t| sh "coffee -c -o ./lib src/node-api.coffee" end
file "bin/node-api"    => [ "bin", "lib", "lib/node-api.js" ] do |t|
  sh "echo '#!/usr/bin/env node
' > bin/node-api"
    sh "cat lib/node-api.js >> bin/node-api"
    sh "chmod +x bin/node-api"
end

file "/usr/local/bin/node-api" => [ "/usr/local/bin", "bin/node-api" ] do |t|
  Dir.chdir "/usr/local/bin" do |prefix_pwd|
    sh "ln -s #{pwd}/bin/node-api"
  end
end

task :build   => [ "bin/node-api" ] do |t| sh "cp ./src/*.js ./bin/" end
task :install => [ "/usr/local/bin/node-api" ]
task :clean   => [ :uninstall ] do |t|
  if File.exist? "./bin/node-api"    then sh "rm ./bin/node-api"    end
  if File.exist? "./lib/node-api.js" then sh "rm ./lib/node-api.js" end
end

task :uninstall                 do |t| if File.symlink? "/usr/local/bin/node-api" then sh "rm /usr/local/bin/node-api" end end

task :clean_modules  do |t| sh "rm -rf ./node_modules" end
task :nuke           => [ :clean_modules, :clean ]
task :rebuild        => [ :nuke, :build ]


